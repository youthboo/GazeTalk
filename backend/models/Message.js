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
  frequency_word: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // ค่าตั้งต้นคือ 1
    allowNull: false,
  },
}, {
  tableName: 'Messages'
});

Message.belongsTo(Patient, { foreignKey: 'patient_id' });

module.exports = Message;
