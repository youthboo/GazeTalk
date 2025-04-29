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

        // กำหนดช่วงอายุสำหรับการค้นหา
        let minAge, maxAge;
        if (ageGroup === '13-19') { minAge = 13; maxAge = 19; }
        else if (ageGroup === '20-39') { minAge = 20; maxAge = 39; }
        else if (ageGroup === '40-59') { minAge = 40; maxAge = 59; }
        else { minAge = 60; maxAge = 120; }

        const minBirthYear = today.getFullYear() - maxAge;
        const maxBirthYear = today.getFullYear() - minAge;

        // ค้นหาข้อความที่มีเนื้อหาเดียวกัน และผู้ป่วยมีเพศและช่วงอายุเดียวกัน
        const existingMessages = await Message.findAll({
            include: [{
                model: Patient,
                where: {
                    gender: patient.gender,
                    dateOfBirth: {
                        [Op.gte]: new Date(minBirthYear, 0, 1),
                        [Op.lte]: new Date(maxBirthYear, 11, 31)
                    }
                }
            }],
            where: {
                text: text.trim().toLowerCase()
            }
        });

        if (existingMessages && existingMessages.length > 0) {
            // ถ้ามีข้อความที่ตรงเงื่อนไขอยู่แล้ว ใช้รายการแรก
            const existingMessage = existingMessages[0];
            existingMessage.frequency_word += 1;
            await existingMessage.save();

            return res.status(200).json({
                message: 'Message frequency updated',
                data: existingMessage
            });
        } else {
            // ถ้าไม่มี ให้สร้างข้อความใหม่
            const newMessage = await Message.create({
                text: text.trim().toLowerCase(),
                patient_id,
                timestamp: new Date(),
                frequency_word: 1 // ตั้งค่าเริ่มต้นเป็น 1
            });

            return res.status(200).json({
                message: 'Message saved successfully',
                data: newMessage
            });
        }
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Error saving message', error });
    }
});

// เพิ่มเส้นทางใหม่หรือปรับปรุงเส้นทาง /messages ที่มีอยู่
router.get('/messages', async (req, res) => {
    const { gender, ageRange, startDate, endDate } = req.query;

    try {
        if (!gender || !ageRange) {
            return res.status(400).json({ message: 'Gender and age range are required' });
        }

        const ageBounds = ageRange === "60-120" ? [60, 120] : ageRange.split('-').map(Number);
        const currentYear = new Date().getFullYear();
        const lowerBoundYear = currentYear - ageBounds[1];
        const upperBoundYear = currentYear - ageBounds[0];
        const lowerBoundDate = new Date(lowerBoundYear, 0, 1).toISOString();
        const upperBoundDate = new Date(upperBoundYear, 11, 31).toISOString();

        // ดึงข้อมูลผู้ป่วยตามเพศและช่วงอายุ
        const patients = await Patient.findAll({
            where: {
                gender,
                dateOfBirth: {
                    [Op.gte]: lowerBoundDate,
                    [Op.lte]: upperBoundDate,
                },
            },
        });

        if (patients.length === 0) {
            return res.json({ messages: [] });
        }

        // เตรียมเงื่อนไขสำหรับการค้นหาข้อความ
        const messageConditions = {
            patient_id: patients.map(p => p.patient_id),
        };
        
        // เพิ่มเงื่อนไขช่วงวันที่ถ้ามีการระบุ
        if (startDate && endDate) {
            messageConditions.timestamp = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // ดึงข้อความตามเงื่อนไข
        const messages = await Message.findAll({
            where: messageConditions,
            include: [{
                model: Patient,
                attributes: ['gender', 'dateOfBirth'],
            }],
        });

        // สรุปคำในข้อความและนับความถี่
        const wordCount = {};
        messages.forEach(message => {
            const word = message.text.trim().toLowerCase();
            if (word) {
                wordCount[word] = (wordCount[word] || 0) + message.frequency_word;
            }
        });

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

// เพิ่มเส้นทางสำหรับลบข้อความตามช่วงอายุและเพศ
router.delete('/messages', async (req, res) => {
    const { gender, ageRange, word } = req.query;

    try {
        if (!gender || !ageRange) {
            return res.status(400).json({ message: 'Gender and age range are required' });
        }

        const ageBounds = ageRange === "60-120" ? [60, 120] : ageRange.split('-').map(Number);
        const currentYear = new Date().getFullYear();
        const lowerBoundYear = currentYear - ageBounds[1];
        const upperBoundYear = currentYear - ageBounds[0];
        const lowerBoundDate = new Date(lowerBoundYear, 0, 1).toISOString();
        const upperBoundDate = new Date(upperBoundYear, 11, 31).toISOString();

        // ดึงข้อมูลผู้ป่วยตามเพศและช่วงอายุ
        const patients = await Patient.findAll({
            where: {
                gender,
                dateOfBirth: {
                    [Op.gte]: lowerBoundDate,
                    [Op.lte]: upperBoundDate,
                },
            },
        });

        if (patients.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ป่วยในช่วงอายุและเพศที่ระบุ' });
        }

        // เงื่อนไขการลบ
        const deleteCondition = {
            patient_id: patients.map(p => p.patient_id),
        };
        
        // ถ้ามีการระบุคำเฉพาะ ให้เพิ่มเงื่อนไขในการลบ
        if (word) {
            deleteCondition.text = word.trim().toLowerCase();
        }

        // ลบข้อความ
        const deleteCount = await Message.destroy({
            where: deleteCondition
        });

        res.status(200).json({ 
            message: `ลบข้อความจำนวน ${deleteCount} รายการเรียบร้อยแล้ว`,
            count: deleteCount
        });
    } catch (error) {
        console.error('Error deleting messages:', error);
        res.status(500).json({ error: 'ไม่สามารถลบข้อความได้' });
    }
});

module.exports = router;
