'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Patients', 'group_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // หรือ false ถ้าต้องการบังคับ
      
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Patients', 'group_id');
  }
};
