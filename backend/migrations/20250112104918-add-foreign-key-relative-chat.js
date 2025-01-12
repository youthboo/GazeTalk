'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('Relative_ChatID', {
      fields: ['patient_id'],
      type: 'foreign key',
      name: 'fk_patient_id', // ชื่อ constraint
      references: {
        table: 'Patients',
        field: 'patient_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Relative_ChatID', 'fk_patient_id');
  },
};
