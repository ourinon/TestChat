module.exports = (sequelize, DataTypes) => {

 
    //chattingblocking 테이블과 맵핑되는 chattingblocking모델 정의
    return sequelize.define('chattingblocking', {
        chatRoomName: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        userNickName: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        blockingType: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        ipAddress: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        blockingDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        blockingEndDate: {
            type: DataTypes.DATE,
            allowNull: false
        }

    }, {
        timestamps: true,
        paranoid: true
    });

};