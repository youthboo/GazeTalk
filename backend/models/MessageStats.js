// models/MessageStats.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const MessageStats = sequelize.define('MessageStats', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age_group: {
    type: DataTypes.STRING,
    allowNull: false
  },
  frequency: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  last_timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = MessageStats;
