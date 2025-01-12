'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Messages', {
            message_id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            text: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            patient_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Patients', // ชื่อของตาราง Patients
                    key: 'patient_id', // คอลัมน์ใน Patients ที่จะอ้างถึง
                },
                onUpdate: 'CASCADE', // ตัวเลือกในการอัปเดต
                onDelete: 'SET NULL', // ตัวเลือกในการลบ
            },
            timestamp: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Messages');
    }
};
