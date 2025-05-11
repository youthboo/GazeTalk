const express = require('express');
const { Op } = require('sequelize');
const Message = require('../models/Message');
const Patient = require('../models/Users');
const MessageStats = require('../models/MessageStats');
const router = express.Router();
const moment = require('moment');

router.post('/send-message', async (req, res) => {
    const { text, patient_id } = req.body;

    try {
        if (!patient_id) {
            return res.status(400).json({ message: 'Patient ID is required' });
        }

        // ดึงข้อมูลผู้ป่วยเพื่อหาเพศและอายุ
        const patient = await Patient.findByPk(patient_id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // คำนวณช่วงอายุ
        const birthDate = new Date(patient.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        let ageGroup;
        if (age >= 13 && age <= 19) ageGroup = '13-19';
        else if (age >= 20 && age <= 39) ageGroup = '20-39';
        else if (age >= 40 && age <= 59) ageGroup = '40-59';
        else if (age >= 60) ageGroup = '60-120';
        else return res.status(400).json({ message: 'Patient age is not in any valid range' });

        const cleanText = text.trim().toLowerCase();

        // ตรวจสอบว่าผู้ป่วยคนนี้เคยส่งข้อความนี้แล้วหรือไม่
        const existingMessage = await Message.findOne({
            where: {
                patient_id,
                text: cleanText
            }
        });

        let messageResponse;

        if (existingMessage) {
            // อัพเดทความถี่ถ้าเจอข้อความเดิม
            existingMessage.frequency_word += 1;
            existingMessage.timestamp = new Date(); // อัพเดทเวลาล่าสุด
            await existingMessage.save();
            messageResponse = existingMessage;
        } else {
            // สร้างข้อความใหม่ถ้าไม่เจอข้อความเดิม
            const newMessage = await Message.create({
                text: cleanText,
                patient_id,
                timestamp: new Date(),
                frequency_word: 1
            });
            messageResponse = newMessage;
        }

        // อัพเดทหรือสร้างข้อมูลสถิติใน MessageStats (คงเดิม)
        const [statRecord, created] = await MessageStats.findOrCreate({
            where: {
                text: cleanText,
                gender: patient.gender,
                age_group: ageGroup
            },
            defaults: {
                frequency: 1,
                last_timestamp: new Date()
            }
        });

        // ถ้าเจอข้อมูลเดิม ให้อัพเดทความถี่และเวลาล่าสุด
        if (!created) {
            statRecord.frequency += 1;
            statRecord.last_timestamp = new Date();
            await statRecord.save();
        }

        return res.status(200).json({
            message: existingMessage ? 'Message frequency updated' : 'Message saved successfully',
            data: messageResponse,
            statistics: statRecord
        });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Error saving message', error });
    }
});

router.get('/messages', async (req, res) => {
    const { gender, ageRange, startDate, endDate } = req.query;

    try {
        if (!gender || !ageRange) {
            return res.status(400).json({ message: 'Gender and age range are required' });
        }

        // เตรียมเงื่อนไขสำหรับการค้นหา
        const conditions = {
            gender,
            age_group: ageRange
        };
        
        // เพิ่มเงื่อนไขช่วงวันที่ถ้ามีการระบุ
        if (startDate && endDate) {
            conditions.last_timestamp = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // ดึงข้อมูลความถี่จากตาราง MessageStats
        const statistics = await MessageStats.findAll({
            where: conditions,
            order: [['frequency', 'DESC']]
        });

        const summary = statistics.map(stat => ({
            word: stat.text,
            usage_count: stat.frequency,
            last_used: stat.last_timestamp
        }));

        res.json({ summary });
    } catch (error) {
        console.error('Error fetching message statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/messages', async (req, res) => {
    const { gender, ageRange, word } = req.query;

    try {
        if (!gender || !ageRange) {
            return res.status(400).json({ message: 'Gender and age range are required' });
        }

        // เงื่อนไขการลบ
        const deleteCondition = {
            gender,
            age_group: ageRange
        };
        
        // ถ้ามีการระบุคำเฉพาะ ให้เพิ่มเงื่อนไขในการลบ
        if (word) {
            deleteCondition.text = word.trim().toLowerCase();
        }

        // ลบข้อมูลสถิติ
        const deleteCount = await MessageStats.destroy({
            where: deleteCondition
        });

        res.status(200).json({ 
            message: `ลบข้อมูลสถิติจำนวน ${deleteCount} รายการเรียบร้อยแล้ว`,
            count: deleteCount
        });
    } catch (error) {
        console.error('Error deleting message statistics:', error);
        res.status(500).json({ error: 'ไม่สามารถลบข้อมูลสถิติได้' });
    }
});

module.exports = router;
