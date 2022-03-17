var os = require('os');
const jwt = require('jsonwebtoken');
let moment = require('moment');

const db = require('./models/index.js');
const sequelize = db.sequelize;

const Sequelize = db.Sequelize;
const Op = db.Sequelize.Op;

// const SocketIO = require('socket.io');

var ChattingService = db.ChattingService;
var ChattingBlocking = db.ChattingBlocking;
var ChattingLog = db.ChattingLog;
var Announcement = db.Announcement;


//소켓통신 모듈
module.exports = (server) => {

    //express서버와 socket.io연결
    // const io = SocketIO(server, { path: '/socket.io' });

    //CORS 대응 
    const io = require('socket.io')(server, {
        cors: {
            // origin: "http://localhost:3001",
            origin: "*",
            methods: ["GET", "POST"]
        }
      });

    //채팅사용자목록
    let chatUsers = [];

    //socket 연결이 완료된 상태에서의 기능처리
    io.on('connection', (socket) => {

        //소켓Req객체
        const req = socket.request;

        //접속 클라이언트 IP주소
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const socketID = socket.id;
        let chatNickName = "";

        //console.log('새로운 클라이언트 접속!', userIP, socket.id, req.ip);

        //소켓 연결해제
        socket.on('disconnect', () => {
            UserConnectionOut();
            clearInterval(socket.interval);
        });

        //소켓 에러발생시 로깅
        socket.on('error', (error) => {
            console.error(error);
        });

        //채팅방 조인
        socket.on('joinGroup', async (token) => {
            try {
                let tokenInfo = "";
                const nowDate = Date.now();

                if (token.length === 0) {
                    socket.emit('entryRoomMsg', "", "사용자 토큰정보가 제공되지 않았습니다.", "Deny", 0);
                    return;
                }

                //0.사용자 토큰정보 추출
                if (token.length > 0) {
                    tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
                    // console.log(tokenInfo);
                    chatNickName = tokenInfo.nickname;

                    if (chatNickName == "") {
                        chatNickName = tokenInfo.userid;
                    }
                }

                let room = await ChattingService.findOne(
                    {
                        where: { chatRoomName: tokenInfo.roomid }
                    }
                );
                var tDate = new Date();
                tDate.setMinutes(tDate.getMinutes()+30)

                //2.채팅방 정보 등록
                if (room === null) {
                    room = await ChattingService.create(
                        {
                            userID: tokenInfo.userid,
                            chatRoomName: tokenInfo.roomid,
                            chatRoomDescription: tokenInfo.roomname,
                            serviceDomain: "",
                            counselor:"",
                            counselorID: 0,
                            themeCode: "",//1:1채팅방-/M:다중채팅방
                            targetID: "",
                            userLimits: 2, //두명
                            imageFullPath: "",
                            openState: true,
                            appOpenState: false,
                            autoClosedAt: tDate
                        }
                    );
                    io.emit("entryUserPush", tokenInfo.roomid, chatNickName);
                } else {
                    if (room.openState == false) {
                        socket.emit('entryRoomMsg', "", "해당 채팅방은 사용하실수 없습니다.", "Deny", 0);
                        return;
                    }
                }


                //3.IP차단정보 체크
                const blocking = await ChattingBlocking.findOne(
                    {
                        where: { chatRoomName: tokenInfo.roomid, ipAddress: userIP, blockingEndDate: { [Op.gt]: nowDate } }
                    }
                );

                if (blocking !== null) {
                    socket.emit('entryRoomMsg', chatNickName, "관리자에 의해 요청 서비스가 거부되었습니다.", "IPDeny", 0);
                    return;
                }

                //4.채팅방 정보 및 접속자 정보조회
                const clientsInRoom = io.sockets.adapter.rooms[tokenInfo.roomid];
                let groupUserCnt = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
                console.log("room.userLimits",room.userLimits)
                console.log("groupUserCnt",groupUserCnt)

                if (groupUserCnt >= room.userLimits) {
                    socket.emit('entryRoomMsg', chatNickName, "동시접속자수 " + room.userLimits + "명을 초과하였습니다.", "Deny", 0);
                    return;
                }

                //5.채팅방 입장
                socket.join(tokenInfo.roomid);

                //모든 채팅접속 사용자에게 푸시 메시징 발송(관리자 사이트 페이지 포함)
                io.emit("entryAdminPush", tokenInfo.roomid, chatNickName);

                //6.채팅방별 접속자 정보 등록 : 메모리
                var entryUser = {
                    roomName: tokenInfo.roomid,
                    connectionID: socketID,
                    nickName: chatNickName,
                    uid: tokenInfo.userid,
                    photoURL: tokenInfo.imgurl,
                    ipAddress: userIP,
                    userType: 3,
                    chatState: 1,
                    connectedDate: Date.now()
                };

                chatUsers.push(entryUser);
                groupUserCnt += 1;

                //7.채팅이력조회
                //Raw Query Sample
                //const logs = await sequelize.query('SELECT * FROM chattinglogs', {
                //    model: ChattingLog,
                //    mapToModel: true
                //});
                let chatHistory = await sequelize.query('CALL SelectChatHistoryByChannel (:roomName, :topCount)', { replacements: { roomName: tokenInfo.roomid, topCount: 50 } });


                //8.입장메시지처리

                //현재접속자에게만 보내기
                socket.emit('entryRoomMsg', chatNickName, chatNickName + " 님으로 입장하셨습니다.", "Ok", groupUserCnt, chatHistory);
                let announcement = [];

                announcement = await Announcement.findAll({ where: { usedYN: "1", }, order: [["num", "ASC"]]});
                // console.log("멘트확인:",announcement)

                if (announcement !== null){
                    for (var i=0; i < announcement.length; i++) { 
                        socket.emit('systemMessage', chatNickName, announcement[i].contents, "ment", groupUserCnt, chatHistory);
                    }
                }

                //현재접속자를 제외한 다른사용자들에게 보내기
                chatHistory = [];
                socket.to(tokenInfo.roomid).emit('entryRoomMsg', chatNickName, chatNickName + " 님이 입장하셨습니다.", "Ok", groupUserCnt, chatHistory);


                //9.DB 채팅로깅
                ChattingLogging(tokenInfo.roomid, chatNickName, chatNickName + " 님이 입장하셨습니다.", 3, 1);

            } catch (err) {
                console.log('err:', err);
            }

        });

        //그룹채팅 키입력중 메시지 처리
        socket.on('keyUpMessage', function (token, message) {

            if (token.length === 0) {
                socket.emit('entryRoomMsg', chatNickName, "사용자 토큰정보가 제공되지 않았습니다.", "Deny", 0);
                return;
            }

            let tokenInfo = "";
            if (token.length > 0) {
                tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            }

            if (message.length > 0) {
                socket.to(tokenInfo.roomid).emit('typingComplete', chatNickName, "입력완료");
            } else {
                socket.to(tokenInfo.roomid).emit('typingInit', chatNickName, "입력초기화");
            }
        });

        //그룹채팅 키입력중 메시지 처리
        socket.on('keyDownMessage', function (token) {
            if (token.length === 0) {
                socket.emit('entryRoomMsg', chatNickName, "사용자 토큰정보가 제공되지 않았습니다.", "Deny", 0);
                return;
            }

            let tokenInfo = "";
            if (token.length > 0) {
                tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            }

            socket.to(tokenInfo.roomid).emit('typingOn', chatNickName, "입력중");
        });

        //그룹채팅 메시지 전송
        socket.on('sendOrigin', function (token, message, fontFamily, fontSize, fontColor, fontStyle) {

            if (token.length === 0) {
                socket.emit('entryRoomMsg', chatNickName, "사용자 토큰정보가 제공되지 않았습니다.", "Deny", 0);
                return;
            }

            let tokenInfo = "";
            if (token.length > 0) {
                tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            }

            message = message.replace("<", "&lt;").replace(">", "&gt;");
            baseTime = moment(Date.now())
                                .format("ahh:mm")
                                .replace("pm", "오후")
                                .replace("am", "오전");

            socket.to(tokenInfo.roomid).emit('broadcastMessage', chatNickName, message, fontFamily, fontSize, fontColor, fontStyle, baseTime);

            //채팅 로깅
            ChattingLogging(tokenInfo.roomid, chatNickName, message, 3, 5);
        });

        //사용자 목록조회
        socket.on('checkUserList', function (token) {

            if (token.length === 0) {
                socket.emit('entryRoomMsg', chatNickName, "사용자 토큰정보가 제공되지 않았습니다.", "Deny", 0);
                return;
            }

            let tokenInfo = "";
            if (token.length > 0) {
                tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            }

            let roomUsers = [];
            for (var i = 0; i < chatUsers.length; i++) {
                if (chatUsers[i].roomName === tokenInfo.roomid) {
                    roomUsers.push(chatUsers[i]);
                }
            }
            socket.emit('getUserList', roomUsers, chatNickName);
        });

        //선택 사용자 IP블록킹 처리
        socket.on('ipBlocking', function (token, checkedUsers) {

            if (token.length === 0) {
                socket.emit('entryRoomMsg', chatNickName, "사용자 토큰정보가 제공되지 않았습니다.", "Deny", 0);
                return;
            }

            let tokenInfo = "";
            if (token.length > 0) {
                tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            }


            for (var i = 0; i < checkedUsers.length; i++) {

                //강퇴처리대상 정보조회
                const userInfo = GetUserInfoByNickName(tokenInfo.roomid, checkedUsers[i].NickName);

                //강퇴처리 정보 등록
                ChatBlocking(userInfo.roomName, userInfo.nickName, checkedUsers[i].BlockingType);

                //강제 퇴장처리
                io.to(`${userInfo.connectionID}`).emit('blocking');
            }
        });

        //자발적 채팅방 나가기
        socket.on('exit', function (token) {

            socket.disconnect();

        });

        //블록킹에 의한 채팅방 강제 나가기
        socket.on('blockExit', function () {

            const userInfo = GetUserInfoBySocketID(socketID);

            //강퇴처리 메시징 처리
            const userCount = GetUserCountByRoom(userInfo.roomName);
            socket.to(userInfo.roomName).emit('goodByDeny', userInfo.nickName, " 님이 강퇴처리 되었습니다.", userCount - 1);
            io.to(`${userInfo.connectionID}`).emit('goodByDeny', userInfo.nickName, " 님이 강퇴처리 되었습니다.", userCount - 1);

            //DB로깅처리
            ChattingLogging(userInfo.roomName, userInfo.nickName, userInfo.nickName + " 님이 강퇴처리 되었습니다.", 3, 2);

            socket.disconnect();
        });

        //사용자 채팅 메시지 브로드 캐스팅처리 : 테스트용
        socket.on('message', function (nick, message) {

            //현재 접속자에게만 메시징 보내기
            socket.emit('message', nick, message);

            //자신을 제외한 모든 사용자에게 메시징
            socket.broadcast.emit('message', nick, message);
        });


        //사용자 채팅 메시지 브로드 캐스팅처리 : 테스트용
        socket.on('pushMsg', function (token) {

            if (token.length === 0) {
                socket.emit('entryRoomMsg', chatNickName, "사용자 토큰정보가 제공되지 않았습니다.", "Deny", 0);
                return;
            }

            let tokenInfo = "";
            if (token.length > 0) {
                tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            }

            //요청자가 관리자인 경우 모든 접속자들에게 알림 푸시 발생 
            if (tokenInfo.roomid === "" && tokenInfo.usertype === "1") {

                //현재 접속자에게만 메시징 보내기
                socket.emit('sysMsg', chatNickName, tokenInfo.message);

                //자신을 제외한 모든 사용자에게 메시징
                socket.broadcast.emit('sysMsg', chatNickName, tokenInfo.message);
            }

            //요청자가 관리자인 경우 특정 채팅방 접속자들에게 알림 푸시 발생 
            if (tokenInfo.roomid !== "" && tokenInfo.usertype === "1") {

                //현재 접속자에게만 메시징 보내기
                socket.emit('sysMsg', chatNickName, tokenInfo.message);

                //특정채팅방 사용자에게 메시징 보내기
                socket.to(tokenInfo.roomid).emit('sysMsg', chatNickName, tokenInfo.message);

            }


        });

        //파일업로드 완료 메시징 처리
        socket.on('fileMsg', function (token, file) {

            if (token.length === 0) {
                socket.emit('entryRoomMsg', chatNickName, "사용자 토큰정보가 제공되지 않았습니다.", "Deny", 0);
                return;
            }

            let tokenInfo = "";
            if (token.length > 0) {
                tokenInfo = jwt.verify(token, process.env.JWT_SECRET);
            }
            let validDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toString().substr(0, 10);
            let message1 = `${process.env.SERVICE_URL}/download?pname=${file.filename}`;
            let message2 = `${process.env.SERVICE_URL}/download?pname=${file.filename}&oname=${file.originalname}`;
            let baseTime = moment(Date.now())
                                .format("ahh:mm")
                                .replace("pm", "오후")
                                .replace("am", "오전");

            socket.to(tokenInfo.roomid).emit('fileMessage', chatNickName, message1, file.originalname, file.size.toString(), validDate, "other", baseTime);
            socket.emit('fileMessage', chatNickName, message1, file.originalname, file.size.toString(), validDate, "me");

            //채팅 로깅
            let dbMsg = `<span class='tmMsg'>파일명:${file.originalname} <br>용량: ${file.size.toString()}Byte<br> <a href = '${message2}'>파일보기</a> <b class='tmTime'></b></span>`;


            //DB로깅처리
            ChattingLogging(tokenInfo.roomid, chatNickName, dbMsg, 3, 7);

        });


        //채팅방별 접속자수 조회 : 관리자용
        socket.on('checkChannelCnt', async () => {

            let rooms = [];
            let roomList = await GetRoomList();

            for (var i = 0; i < roomList.length; i++) {
                var roomInfo = {
                    roomName: roomList[i].chatRoomName,
                    userCnt: GetUserCountByRoom(roomList[i].chatRoomName),
                    chatRoomDescription: roomList[i].chatRoomDescription
                };
                rooms.push(roomInfo);
            }
            socket.emit('getGroupUserCnt', rooms);
        });

        //채팅방 나가기처리
        async function UserConnectionOut() {
            let exitUser = null;

            //채팅목록에서 삭제
            for (var i = 0; i < chatUsers.length; i++) {
                if (chatUsers[i].connectionID === socketID) {
                    exitUser = chatUsers[i];
                    chatUsers.splice(i, 1);
                }
            }

            if (exitUser !== null) {

                //다른 사용자들에게 퇴장 메시지 발송
                socket.to(exitUser.roomName).emit('goodByMsg', exitUser.nickName, chatUsers.length);

                //DB로깅처리
                ChattingLogging(exitUser.roomName, exitUser.nickName, exitUser.nickName + "님이 퇴장하셨습니다.", 3, 2);

            }
        }

        //채팅방 로깅정보 DB저장 처리
        async function ChattingLogging(roomName, name, message, userType, loggingType) {
            try {
                const log = await ChattingLog.create(
                    {
                        chatRoomName: roomName,
                        nickName: name,
                        userTypeCode: userType,
                        loggingType: loggingType,
                        connectionID: socketID,
                        message: message,
                        loggingDate: Date.now(),
                        deviceType: "",
                        browserType: "",
                        ipAddress: userIP
                    }
                );

            } catch (err) {
                console.log("result:", err);
            }
        }

        //블록킹 정보 저장처리
        async function ChatBlocking(roomName, name, blockingType) {
            try {

                var addedDate = blockingType === "D" ? new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                const blocking = await ChattingBlocking.create(
                    {
                        chatRoomName: roomName,
                        userNickName: name,
                        blockingType: blockingType,
                        ipAddress: userIP,
                        blockingDate: Date.now(),
                        blockingEndDate: addedDate,
                    }
                );

            } catch (err) {
                console.log("result:", err);
            }
        }

        //채팅사용자 정보조회
        function GetUserInfoByNickName(roomName, nickName) {
            let selectedUser = null;

            //console.log("ssssssssssssss",roomName,nickName);

            for (var i = 0; i < chatUsers.length; i++) {
                if (chatUsers[i].roomName === roomName && chatUsers[i].nickName === nickName) {
                    selectedUser = chatUsers[i];
                }
            }
            return selectedUser;
        }

        //채팅사용자 정보조회
        function GetUserInfoBySocketID(userSocketID) {
            let selectedUser = null;
            for (var i = 0; i < chatUsers.length; i++) {
                if (chatUsers[i].connectionID === userSocketID) {
                    selectedUser = chatUsers[i];
                }
            }
            return selectedUser;
        }

        //채팅목록에서 채팅 대상 삭제하기
        function RemoveUserInfo(userSocketID) {
            for (var i = 0; i < chatUsers.length; i++) {
                if (chatUsers[i].connectionID === userSocketID) {
                    chatUsers.splice(i, 1);
                }
            }
        }

        //채팅방 접속자 수 조회
        function GetUserCountByRoom(roomName) {
            let ttlCount = 0;
            for (var i = 0; i < chatUsers.length; i++) {
                if (chatUsers[i].roomName === roomName) {
                    ttlCount++;
                }
            }
            return ttlCount;
        }

        //전체 채팅방목록 조회
        async function GetRoomList() {
            let rooms = await ChattingService.findAll();
            return rooms;
        }


    });
};