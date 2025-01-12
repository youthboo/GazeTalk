'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Patients', 'email', {
      type: Sequelize.STRING,
      allowNull: false, // คอลัมน์ต้องมีค่า (ห้าม null)
      unique: true, // ห้ามซ้ำ
      validate: {
        isEmail: true, // ตรวจสอบว่าเป็นอีเมลที่ถูกต้อง
      },
    });

    await queryInterface.addColumn('Admins', 'email', {
      type: Sequelize.STRING,
      allowNull: false, // คอลัมน์ต้องมีค่า (ห้าม null)
      unique: true, // ห้ามซ้ำ
      validate: {
        isEmail: true, // ตรวจสอบว่าเป็นอีเมลที่ถูกต้อง
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Patients', 'email');
    await queryInterface.removeColumn('Admins', 'email');
  },
};
