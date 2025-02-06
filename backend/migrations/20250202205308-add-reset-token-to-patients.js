'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('Patients', 'resetToken', {
          type: Sequelize.STRING,
          allowNull: true,
      });

      await queryInterface.addColumn('Patients', 'resetTokenExpiry', {
          type: Sequelize.DATE,
          allowNull: true,
      });
  },

  down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn('Patients', 'resetToken');
      await queryInterface.removeColumn('Patients', 'resetTokenExpiry');
  }
};

