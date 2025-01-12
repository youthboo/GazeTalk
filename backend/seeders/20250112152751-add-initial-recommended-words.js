module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ลบข้อความที่มีอยู่ก่อน
    await queryInterface.bulkDelete('RecommendedWord', null, {});

    // เพิ่มข้อความใหม่
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

    // เพิ่มข้อมูลใหม่
    return queryInterface.bulkInsert('RecommendedWord', data);
  },

  down: async (queryInterface, Sequelize) => {
    // ลบข้อความใหม่ทั้งหมด (revert seed)
    return queryInterface.bulkDelete('RecommendedWord', null, {});
  },
};
