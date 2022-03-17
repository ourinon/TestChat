'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

require('dotenv').config();

//웹소켓 모듈추가
const webSocket = require('./socket');

//CORS 모듈추가
const cors = require('cors');

//시퀄라이저 ORM 객체 불러오기
var sequelize = require('./models/index.js').sequelize;

//채팅 라우터
var indexRouter = require('./routes');

//express Application 객체생성
var app = express();
app.use(express.json())

//CORS 지원처리
app.use(cors());

//시퀄라이즈 ORM객체를 MYSQL에 연결하고 동기화처리
sequelize.sync();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(express.json())
app.use(express.urlencoded({extended : false}));

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))

//채팅 라우팅 설정
app.use('/', indexRouter);

//404에러 처리기
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


//개발모드에서의 에러처리기
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}


//프로덕션모드에서의 에러처리기
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

//어플리케이션 웹사이트 포트설정
app.set('port', process.env.PORT || 3000);

//웹어플리케이션 웹사이트 오픈 
var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

//에러 이벤트 처리기설정
server.on('error', onError);

//listening 이벤트 처리기 설정
server.on('listening', onListening);

//웹소켓 express서버와 연결처리
webSocket(server);

//전역에러처리기
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

//listening 이벤트 처리기
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}