const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment'); // ใช้ moment สำหรับคำนวณอายุ
const Patient = require('../models/Users');
const Admin = require('../models/Admin');

const router = express.Router();

// ลงทะเบียนผู้ใช้ใหม่
router.post('/signup', async (req, res) => {
    const { username, password, dateOfBirth, gender, code, userType } = req.body;

    try {
        const existingUser = await Admin.findOne({ where: { username } }) || await Patient.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if (userType === 'admin') {
            const admin = await Admin.create({
                username,
                password: hashedPassword,
                code
            });
            res.status(201).json({ message: 'Admin created successfully' });
        } else {
            const patient = await Patient.create({
                username,
                password: hashedPassword,
                dateOfBirth,
                gender
            });
            res.status(201).json({ message: 'Patient created successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// เข้าสู่ระบบผู้ใช้
router.post('/login', async (req, res) => {
    const { username, password, code } = req.body;

    try {
        let user;
        let isAdmin = false;
        let patientId = null;
        let gender = null;
        let ageRange = null;

        // ตรวจสอบผู้ใช้จากตาราง Admins ก่อน
        user = await Admin.findOne({ where: { username } });

        if (user) {
            if (user.code !== code) {
                return res.status(400).json({ message: 'Invalid code for admin' });
            }
            isAdmin = true;
        } else {
            // หากไม่พบในตาราง Admin ให้ตรวจสอบในตาราง Patients
            user = await Patient.findOne({ where: { username } });

            if (user) {
                patientId = user.patient_id;
                gender = user.gender;

                // คำนวณช่วงอายุ
                const currentAge = moment().diff(moment(user.dateOfBirth), 'years');
                if (currentAge >= 13 && currentAge <= 19) {
                    ageRange = '13-19';
                } else if (currentAge >= 20 && currentAge <= 39) {
                    ageRange = '20-39';
                } else if (currentAge >= 40 && currentAge <= 59) {
                    ageRange = '40-59';
                } else if (currentAge >= 60) {
                    ageRange = '60-120';
                }
            }
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // สร้าง token ใหม่
        const token = jwt.sign(
            { id: isAdmin ? user.admin_id : user.patient_id, userType: isAdmin ? 'admin' : 'patient' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({ token, isAdmin, patient_id: patientId, gender, ageRange });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
