module.exports = (sequelize, DataTypes) => {

  //chattinglog 테이블과 맵핑되는 chattinglog모델 정의
    return sequelize.define('chattinglog', {
        chatRoomName: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        uid: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        nickName: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        userTypeCode: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        loggingType: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        connectionID: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        message: {
            type: DataTypes.STRING(1000),
            allowNull: true
        },
        loggingDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        deviceType: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        browserType: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        ipAddress: {
            type: DataTypes.STRING(20),
            allowNull: true
        }

    }, {
        timestamps: true,
        paranoid: true
    });

};