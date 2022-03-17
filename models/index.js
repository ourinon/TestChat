const path = require('path');
const Sequelize = require('sequelize');

//DB연결정보가 있는 config파일에서 development항목의 DB정보를 조회한다.
// const env = process.env.NODE_ENV || 'development';
const env = process.env.NODE_ENV || 'test';
//const env = process.env.NODE_ENV || 'production';
const config = require(path.join(__dirname, '..', 'config', 'config.json'))[env];

//DB관리 객체 생성
const db = {};

//시퀄라이즈 ORM객체 생성
//시퀄라이즈 ORM객체 생성시 관련 DB연결정보 전달생성
const sequelize = new Sequelize(config.database, config.username, config.password, config);

//DB객체에 시퀄라이즈 객체를 속성에 바인딩한다.
//DB객체에 시퀄라이즈 모듈을 속성에 바인딩한다.
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Config = config;

//각종 정의모델모듈 추가 및 관계정의
//하기 코드가 실행되면서 물리적 테이블이 생성된다.
db.Admin = require('./admin')(sequelize,Sequelize);
db.ChattingService = require('./chattingservice')(sequelize, Sequelize);
db.ChattingUser = require('./chattinguser')(sequelize, Sequelize);
db.ChattingLog = require('./chattinglog')(sequelize, Sequelize);
db.ChattingBlocking = require('./chattingblocking')(sequelize, Sequelize);
db.Sample = require('./sample')(sequelize, Sequelize);
db.Announcement = require('./announcement')(sequelize,Sequelize);

//DB관리객체 모듈 출력
module.exports = db;

