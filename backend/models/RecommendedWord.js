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

// ตั้งค่าคำเริ่มต้นด้วย Sequelize Hook
RecommendedWord.afterSync(async () => {
  try {
    // ตรวจสอบว่าตารางมีข้อมูลหรือไม่
    const count = await RecommendedWord.count();
    if (count === 0) { // ถ้าตารางยังว่าง
      const words = [
        'สวัสดี',
        'คิดถึง',
        'ขอโทษ',
        'รักนะ',
        'ช่วยโทรหาญาติ',
        'ช่วยเปิดหน้าต่าง',
        'ช่วยปิดไฟ',
        'หิวข้าว',
        'สบายดี'
      ];

      const genders = ['male', 'female', 'other'];
      const ageRanges = ['13-19', '20-39', '40-59', '60-120'];

      const data = [];
      words.forEach((word) => {
        genders.forEach((gender) => {
          ageRanges.forEach((age_range) => {
            data.push({ word, gender, age_range });
          });
        });
      });

      // เพิ่มข้อมูลครั้งแรก
      await RecommendedWord.bulkCreate(data);
      console.log('Default recommended words added successfully!');
    } else {
      console.log('Recommended words already exist. No default data added.');
    }
  } catch (error) {
    console.error('Error managing default recommended words:', error);
  }
});

module.exports = RecommendedWord;
