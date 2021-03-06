module.exports = (sequelize,DataTypes) => {
    return sequelize.define('announcement',{
        num:{
            type:DataTypes.INTEGER,
            allowNull:false,
        },
        mentTypeCode:{
            type:DataTypes.INTEGER,
            allowNull:false,
        },
        contents:{
            type:DataTypes.TEXT,
            allowNull:false,
        },
        usedYN:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
        },
        createdUID:{
            type:DataTypes.STRING(100),
            allowNull:false,
        },
        updatedUID:{
            type:DataTypes.STRING(100),
            allowNull:false,
        },
        deletedUID:{
            type:DataTypes.STRING(100),
            allowNull:true,
        },
    },{
        timestamp:true,
        paranoid:true
    })
}