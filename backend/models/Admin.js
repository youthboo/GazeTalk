const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Admin = sequelize.define('Admin', {
    admin_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});

module.exports = Admin;
