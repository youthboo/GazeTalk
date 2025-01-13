// models/RecommendedWord.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');  

const RecommendedWord = sequelize.define('RecommendedWord', {
  word_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,  
  },
  word: {
    type: DataTypes.STRING,
    allowNull: false,  
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'), 
    allowNull: false,  
  },
  age_range: {
    type: DataTypes.ENUM('13-19', '20-39', '40-59', '60-120'), 
    allowNull: false,  
  },
}, {
  tableName: 'RecommendedWord',  
  timestamps: false,  
});

module.exports = RecommendedWord;
