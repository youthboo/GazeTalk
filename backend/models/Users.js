const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Patient = sequelize.define('Patient', {
    patient_id: {
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
    dateOfBirth: {
        type: DataTypes.DATEONLY, // ใช้ DataTypes.DATEONLY แทน DataTypes.DATE
        allowNull: false,
    },
    gender: {
        type: DataTypes.STRING,
    },
}, {
    tableName: 'Patients'
});

module.exports = Patient;
