module.exports = (sequelize, DataTypes) => {

   //chattingservice 테이블과 맵핑되는 chattingservice모델 정의
    return sequelize.define('chattingservice', {
        userID: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        chatRoomName: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        chatRoomDescription: {
            type: DataTypes.STRING(1000),
            allowNull: false
        },
        serviceDomain: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        counselor: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        counselorID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        themeCode: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        targetID: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        userLimits: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        imageFullPath: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        openState: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        appOpenState: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        autoClosedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        realClosedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        }

    }, {
        timestamps: true,
        paranoid: true
    });

    //timestamps �� ������ ���̺� createdAt,updatedAt�÷��� �ڵ��߰��ϰ�
    //������ �űԻ����Ͻ�,�����Ͻ� �����͸� �ڵ����� ��ŷ���ݴϴ�.
    //paranoid�� Ʈ���̸� deletedAt�÷��� �ڵ��߰��ǰ�
    //������ �����Ͻ������� �ڵ� ��ŷ�ǰ� �����ʹ� ���� �������� �ʽ��ϴ�.

};