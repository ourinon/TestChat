module.exports = (sequelize, DataTypes) => {

 
    //chattinguser 테이블과 맵핑되는 chattinguser모델 정의
    return sequelize.define('chattinguser', {
        chatRoomName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            Comment : "룸 이름"
        },
        chatType: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
            comment: "0:일반"
        },
        userID: {
            type: DataTypes.STRING(100),
            allowNull: false,
            Comment : "유저 아이디"
        },
        nickName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            Comment : "대화명"
        },
        userType: {
            type: DataTypes.STRING(10),
            allowNull: false,
            Comment : "유져 타입"
        },
        imgUrl: {
            type: DataTypes.STRING(100),
            allowNull: true,
            Comment : "이미지주소"
        },
        ipAddress: {
            type: DataTypes.STRING(20),
            allowNull: false,
            Comment : "아이피 주소"
        },
        extra1: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        extra2: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        damageType: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
            comment: "피해유형"
        },
        area: {
            type: DataTypes.STRING(50),
            allowNull: true,
            Comment : "지역"
        },
        age: {
            type: DataTypes.TINYINT,
            allowNull: true,
            Comment : "나이"
        },
        victimSex: {
            type: DataTypes.INTEGER,
            allowNull: true,
            Comment : "피해자 성별"
        },
        victimRelationship: {
            type: DataTypes.TINYINT,
            allowNull: true,
            Comment : "피해자 관계"
        },

    }, {
        timestamps: true,
        paranoid: true
    });

};