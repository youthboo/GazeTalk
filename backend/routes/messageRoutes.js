const express = require('express');
const { Op } = require('sequelize');
const Message = require('../models/Message');
const Patient = require('../models/Users');
const router = express.Router();
const moment = require('moment');

// เส้นทางที่ใช้ในการบันทึกข้อความ
router.post('/send-message', async (req, res) => {
    const { text, patient_id } = req.body; 

    try {
        if (!patient_id) {
            return res.status(400).json({ message: 'Patient ID is required' });
        }

        const message = await Message.create({
            text,
            patient_id,
            timestamp: new Date() 
        });

        res.status(200).json({ message: 'Message saved successfully', data: message });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Error saving message', error });
    }
});

// เส้นทางสำหรับดึงข้อมูลข้อความ
router.get('/messages', async (req, res) => {
    const { gender, ageRange } = req.query;

    try {
        if (!gender || !ageRange) {
            return res.status(400).json({ message: 'Gender and age range are required' });
        }

        // แยกช่วงอายุและตรวจสอบความถูกต้องของ ageRange
        const ageBounds = ageRange === "60-120" ? [60, 120] : ageRange.split('-').map(Number);
        if (ageBounds.length !== 2 || ageBounds.some(isNaN)) {
            return res.status(400).json({ message: 'Invalid age range format' });
        }

        const currentYear = new Date().getFullYear();
        const lowerBoundYear = currentYear - ageBounds[1]; // ปีสำหรับอายุต่ำสุด
        const upperBoundYear = currentYear - ageBounds[0]; // ปีสำหรับอายุสูงสุด

        const lowerBoundDate = new Date(lowerBoundYear, 0, 1).toISOString(); 
        const upperBoundDate = new Date(upperBoundYear, 11, 31).toISOString(); 

        // ตรวจสอบรูปแบบวันที่ของ upperBoundDate และ lowerBoundDate
        if (!moment(lowerBoundDate).isValid() || !moment(upperBoundDate).isValid()) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        const patients = await Patient.findAll({
            where: {
                gender: gender,
                dateOfBirth: {
                    [Op.gte]: lowerBoundDate,
                    [Op.lte]: upperBoundDate,
                },
            },
        });

        if (patients.length === 0) {
            return res.json({ messages: [] });
        }

        // ดึงข้อความจากผู้ป่วยที่เลือกมา
        const messages = await Message.findAll({
            where: {
                patient_id: patients.map(p => p.patient_id),
            },
            include: [{
                model: Patient,
                attributes: ['gender', 'dateOfBirth'],
            }],
        });

        // สรุปคำในข้อความ
        const wordCount = {};

        messages.forEach(message => {
            const words = message.text.split(/\s+/); // แยกคำจากข้อความโดยใช้ช่องว่าง
            words.forEach(word => {
                word = word.trim().toLowerCase();
                if (word) {
                    wordCount[word] = (wordCount[word] || 0) + 1;
                }
            });
        });

        // แปลงข้อมูลที่สรุปออกมาเป็นรูปแบบที่ต้องการ และเรียงลำดับจากมากไปหาน้อย
        const summary = Object.entries(wordCount)
            .map(([word, count]) => ({
                word,
                usage_count: count,
            }))
            .sort((a, b) => b.usage_count - a.usage_count); 

        res.json({ summary });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
