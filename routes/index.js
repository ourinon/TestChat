'use strict';
var express = require('express');
const jwt = require('jsonwebtoken');
var multer = require('multer');
var fs = require('fs');
var moment = require('moment');
var upload = multer({ dest: 'public/upload/' });
const bcrypt = require('bcryptjs');

const db = require('../models/index.js');
const sequelize = db.sequelize;

const Sequelize = db.Sequelize;
const Op = db.Sequelize.Op;

var ChattingService = db.ChattingService;
var ChattingUser = db.ChattingUser;
var ChattingBlocking = db.ChattingBlocking;
var ChattingLog = db.ChattingLog;
var Admin = db.Admin;

var router = express.Router();

//채팅 메인 페이지
router.get("/",  async (req, res, next) => {

    let roomid = "";
    let roomname = "";
    let userid = "";
    let nickname = "";
    let usertype = "1";
    let token = "";
    let reurl = "";
    // console.log(req.query.roomid);
    roomid = req.query.roomid;
    // console.log(req.query.userid);
        // console.log("111",token);

        // console.log("토큰값 확인",req.query.token)
    //룸아이디와채팅아이디가 전달된경우 임시 토큰 발급 처리

    //토큰정보가 전달된 경우 
    if (req.query.token !== undefined) {
        token = req.query.token;
        console.log("테스트",token);

        var tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("테스트2",tokenInfo);
        // console.log(tokenInfo.roomname);
        // console.log(tokenInfo.nickname);
        roomname = tokenInfo.roomname;
        nickname = tokenInfo.nickname;
        usertype = tokenInfo.usertype;
        reurl = tokenInfo.reurl;
        console.log(reurl)
    
    
    }else{

        if (req.query.roomid !== undefined && req.query.userid !== undefined) {
    // console.log('aaa')
            roomname = req.query.roomid;
            userid = req.query.userid;
            nickname = req.query.nickname;
            usertype = req.query.usertype;
            roomid = req.query.roomid;
            var tokenData = {
                roomid: roomname,
                roomname: roomname,
                userid: nickname,
                nickname: nickname,
                usertype: usertype,
                targetid: "",
                imgurl: "",
                message: ""
            };
            if (roomname !== null){
                ChattingService.update(
                {
                    counselor: nickname,
                    counselorID: userid
                },
                { 
                    where: { chatRoomName: roomname } 
                }
                );
            }
            console.log("333",token);
            const newToken = jwt.sign(tokenData, process.env.JWT_SECRET, {
                expiresIn: '12h', // 60m,10s,24h
                issuer: 'women1366'
            });
            token = newToken;
        }
    }

    let roomdata;
    let createdAt ="";
    let autoclosedAt ="";
    if (usertype != 0){
        if (roomid != null){
            roomdata = await ChattingService.findOne({ where: { chatRoomName: roomid } });
            createdAt ="";
            autoclosedAt ="";
        }
    
        if (roomdata !==null){
            createdAt = roomdata?.createdAt;
            autoclosedAt = roomdata?.autoClosedAt;
        }
    }
console.log(reurl)
    res.render('index.ejs', {moment: moment , roomid: roomid, roomname: roomname, userid: userid, nickname: nickname, usertype: usertype, token: token,createdAt:createdAt ,autoclosedAt:autoclosedAt ,reurl:reurl });
});

//JWT 토큰 발급 샘플 페이지
router.get('/token', function (req, res) {
    res.render('token.ejs');
});


//JWT 토큰 발급 post 메소드
router.post('/token', function (req, res) {

    const roomid = req.body.roomid;
    const roomname = req.body.roomname;
    const userid = req.body.userid;
    const nickname = req.body.nickname;
    const usertype = req.body.usertype;
    const targetid = req.body.targetid;
    const imgurl = req.body.imgurl;
    const message = req.body.message;

    var tokenData = {
        roomid: roomid,
        roomname: roomname,
        userid: userid,
        nickname: nickname,
        usertype: usertype,
        targetid: targetid,
        imgurl: imgurl,
        message: message,
    };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
        expiresIn: '24h', // 60m,10s,24h
        issuer: 'women1366'
    });
    let host_url = req.protocol + "://" + req.get("host");

    res.json({
        token: token,
        url : host_url+"/?token="+token
    });

});

//파일 업로드 샘플페이지
router.get('/uploadfile', function (req, res) {
    res.render('uploadfile.ejs');
});


//파일공유 업로드처리 기능
router.post('/uploadfile', upload.single('files'), function (req, res) {
    //upload.single은 미들웨어처럼 먼저실행과  function (req, res) 콜백함수가 실행된다.
    //console.log(req.file); 
    res.json(req.file);
});


//업로드 파일 다운로드 기능
router.get("/download", function (req, res) {
    var oname = req.query.oname;
    var pname = req.query.pname;

    var filePath = __dirname.replace('routes', '') + "public/upload/" + pname;
    var fileName = oname;

    res.setHeader("Content-Disposition", "attachment;filename=" + encodeURI(fileName));
    res.setHeader("Content-Type", "binary/octet-stream");

    var fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});


//채팅이력 HTML 파일생성 다운로드 기능
router.post("/chatfiledown", function (req, res) {
    var contents = req.body.hidChatHistory;

    var fileName = "chathistory_" + moment(Date.now()).format("YYYYMMDDhhmmss").toString() + ".html";
    var filePath = __dirname.replace('routes', '') + "public/upload/" + fileName;

    fs.writeFile(filePath, contents, function (err) {
        if (err) {
            console.log('Error' + err);
        }
    });

    res.setHeader("Content-Disposition", "attachment;filename=" + encodeURI(fileName));
    res.setHeader("Content-Type", "binary/octet-stream");

    var fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});


//채팅이력조회
router.get('/history', async (req, res) => {
    try {

        const token = req.query.token;
        const logIDX = req.query.logidx;

        var tokenInfo = jwt.verify(token, process.env.JWT_SECRET);

        let chatHistory = await sequelize.query('CALL SelectChatHistorySearch (:roomName,:baseLogIDX,:topCount)', { replacements: { roomName: tokenInfo.roomid, baseLogIDX: logIDX, topCount: 50 } });

        return res.json({
            code: 200,
            result: chatHistory
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, message: '서버에러발생' });
    }

});


//관리자 로그인
router.get('/login', async (req, res) => {
    try {
        let id = req.query.id;
        let pwd = req.query.pwd;

        let exAdmin = await Admin.findOne({ where: { adminID: id } });

        if (exAdmin) {
            const result = await bcrypt.compare(pwd, exAdmin.adminPWD);
            if (result) {
                return res.json({ code: 200, result: exAdmin });
            } else {
                return res.json({ code: 400, message: "암호 정보가 일치하지 않습니다." });
            }

        } else {
            return res.json({ code: 400, message: "사용자 정보가 일치하지 않습니다." });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, message: '서버에러발생' });
    }

});


//채팅방 참여자 목록 조회 OPEN API
router.get('/api/getChatUsers', async (req, res) => {
    try {
        const token = req.query.token;
        let roomid = req.query.roomid;

        if (token != undefined) {
            var tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            roomid = tokenInfo.roomid;
        }

        let users = await ChattingUser.findAll(
            {
                where: { chatRoomName: roomid }
            }
        );

        return res.json({
            code: 200,
            result: users
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, result: '서버에러발생' });
    }

});


//채팅방 대화내역 조회 OPEN API
router.get('/api/getChatHistory', async (req, res) => {
    try {
        const token = req.query.token;
        let roomid = req.query.roomid;

        if (token != undefined) {
            var tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            roomid = tokenInfo.roomid;
        }

        let history = await ChattingLog.findAll(
            {
                where: { chatRoomName: roomid, loggingType: 5 }
            }
        );

        return res.json({
            code: 200,
            result: history
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, result: '서버에러발생' });
    }

});


//채팅방 날짜별 대화내역 조회 OPEN API
router.get('/api/getChatDateHistory', async (req, res) => {
    try {
        const token = req.query.token;
        let roomid = req.query.roomid;
        let date = req.query.date;

        if (token != undefined) {
            var tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            roomid = tokenInfo.roomid;
            date = tokenInfo.message;
        }

        date = moment(date).format("YYYY-MM-DD").toString();
        console.log("날짜포맷:", date);

        let history = await ChattingLog.findAll(
            {
                where: { chatRoomName: roomid, loggingType: 5, loggingDate: { [Op.gte]: date } }
            }
        );

        return res.json({
            code: 200,
            result: history
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, result: '서버에러발생' });
    }

});


//채팅방 최근 대화이력 TOP1
router.get("/api/getmsgone", async (req, res) => {
    try {
        const token = req.query.token;
        let roomid = req.query.roomid;

        if (token != undefined) {
            var tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            roomid = tokenInfo.roomid;
        }

        let log = await ChattingLog.findOne({
            where: { chatRoomName: roomid, loggingType: 5 },
            order: [["id", "DESC"]],
            limit: 1
        });

        return res.json({
            code: 200,
            result: log
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, result: "서버에러발생" });
    }
});

//해당 사용자가 확인못한 메시지 건수
router.get("/api/getcheckmsgcnt", async (req, res) => {
    try {
        const token = req.query.token;
        let roomid = req.query.roomid;
        let userid = req.query.userid;

        if (token != undefined) {
            var tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            roomid = tokenInfo.roomid;
            userid = tokenInfo.userid;
        }

        let log = await ChattingLog.findOne({
            where: { chatRoomName: roomid, loggingType: 5 },
            order: [["id", "DESC"]],
            limit: 1
        });

        let count = 0;

        count = await sequelize.query(
            "CALL SelectCheckMsgCount (:roomName,:userID)",
            {
                replacements: {
                    roomName: roomid,
                    userID: userid
                }
            }
        );

        return res.json({
            code: 200,
            result: count
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ code: 500, result: "서버에러발생" });
    }
});

router.post("/api/addtime", async (req, res) => {

    var roomid = req.body.data;

    console.log(roomid);


    await sequelize.query(
        "CALL UpdateChatTime (:P_chatRoomName)",
        {
            replacements: {
                P_chatRoomName: roomid,
            }
        }
    );

    let roomdata = await ChattingService.findOne({ where: { chatRoomName: roomid } });
    

  return res.json({ code: "200", data: {roomdata}, msg: "Ok" });
});


//JWT 토큰 발급 post 메소드
router.post('/api/token', function (req, res) {

    const roomid = req.body.roomid;
    const roomname = req.body.roomname;
    const userid = req.body.userid;
    const nickname = req.body.nickname;
    const usertype = req.body.usertype;
    const targetid = req.body.targetid;
    const imgurl = req.body.imgurl;
    const message = req.body.message;
    const reurl = req.body.reurl;

    var tokenData = {
        roomid: roomid,
        roomname: roomname,
        userid: userid,
        nickname: nickname,
        usertype: usertype,
        targetid: targetid,
        imgurl: imgurl,
        message: message,
        reurl : reurl,
    };

    console.log(tokenData);

    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
        expiresIn: '24h', // 60m,10s,24h
        issuer: 'women1366'
    });

    let host_url = req.protocol + "://" + req.get("host");

    res.json({
        token: token,
        url : host_url+"/?token="+token
    });

});


module.exports = router;