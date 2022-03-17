module.exports =(sequelize,DataTypes) => {

    return sequelize.define('admin',{
        adminID:{
            type:DataTypes.STRING(100),
            allowNull:false,
        },
        adminPWD:{
            type:DataTypes.STRING(500),
            allowNull:true,
        },
        adminName:{
            type:DataTypes.STRING(50),
            allowNull:false,
        },
        adminEmail:{
            type:DataTypes.STRING(100),
            allowNull:false,
        },
        useYN:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
        },
        createdUID:{
            type:DataTypes.INTEGER,
            allowNull:false,
        },
        updatedUID:{
            type:DataTypes.INTEGER,
            allowNull:false,
        }
    },{
        timestamps:true,
        paranoid:true
    });
};