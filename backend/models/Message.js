const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Patient = require('../models/Users'); 

const Message = sequelize.define('Message', {
    message_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    text: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    patient_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Patient, 
            key: 'patient_id',
        },
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'Messages'
});

// สร้างความสัมพันธ์
Message.belongsTo(Patient, { foreignKey: 'patient_id' });

module.exports = Message;
