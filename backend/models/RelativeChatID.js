const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const RelativeChatID = sequelize.define('Relative_ChatID', {
  telegramID: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Patients', // ชื่อตารางที่อ้างอิง
      key: 'patient_id', // ชื่อคอลัมน์ที่อ้างอิง
    },
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true, // ตรวจสอบว่าเป็นอีเมลที่ถูกต้อง
    },
  },
}, {
  tableName: 'Relative_ChatID',
  timestamps: false,
});

// Export model
module.exports = RelativeChatID;
