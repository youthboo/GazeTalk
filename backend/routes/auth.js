const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Patient = require('../models/Users');
const Admin = require('../models/Admin');
require('dotenv').config();

const router = express.Router();

// Middleware สำหรับตรวจสอบสิทธิ์
const authorizeAdmin = (allowedCodes) => {
    return (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) return res.status(401).json({ message: 'Access denied' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.userType !== 'admin' || !allowedCodes.includes(decoded.adminCode)) {
                return res.status(403).json({ message: 'Permission denied' });
            }
            req.user = decoded;
            next();
        } catch (error) {
            res.status(400).json({ message: 'Invalid token' });
        }
    };
};

// Endpoint สำหรับตรวจสอบ username
router.get('/check-username', async (req, res) => {
    const { username } = req.query;

    try {
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        // ตรวจสอบใน table Admin และ Patient
        const existingAdmin = await Admin.findOne({ where: { username } });
        const existingPatient = await Patient.findOne({ where: { username } });

        // ส่งผลลัพธ์กลับไป
        res.json({
            exists: !!(existingAdmin || existingPatient)
        });
    } catch (error) {
        console.error('Check username error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint สำหรับตรวจสอบ email
router.get('/check-email', async (req, res) => {
    const { email, userType } = req.query;

    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        let exists = false;

        // ถ้าไม่ระบุ userType จะตรวจสอบทั้งสองตาราง
        if (!userType) {
            const existingAdmin = await Admin.findOne({ where: { email } });
            const existingPatient = await Patient.findOne({ where: { email } });
            exists = !!(existingAdmin || existingPatient);
        } 
        // ถ้าระบุ userType เป็น personnel จะตรวจสอบเฉพาะตาราง Admin
        else if (userType === 'personnel') {
            const existingAdmin = await Admin.findOne({ where: { email } });
            exists = !!existingAdmin;
        } 
        // ถ้าระบุ userType เป็น patient จะตรวจสอบเฉพาะตาราง Patient
        else if (userType === 'patient') {
            const existingPatient = await Patient.findOne({ where: { email } });
            exists = !!existingPatient;
        } 
        else {
            return res.status(400).json({ message: 'Invalid user type' });
        }

        // ส่งผลลัพธ์กลับไป
        res.json({
            exists,
            checkedType: userType || 'all'
        });
        
    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ลงทะเบียนผู้ใช้ใหม่
router.post('/signup', async (req, res) => {
    const { username, email, password, dateOfBirth, gender, code, userType } = req.body;

    try {
        // ตรวจสอบว่า username หรือ email ซ้ำหรือไม่
        const existingUser =
            await Admin.findOne({ where: { username } }) ||
            await Patient.findOne({ where: { username } }) ||
            await Admin.findOne({ where: { email } }) ||
            await Patient.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if (userType === 'personnel') {
            // เพิ่มข้อมูล personnel ลงในตาราง Admin
            if (!code) {
                return res.status(400).json({ message: 'Code is required for personnel.' });
            }
            await Admin.create({
                username,
                email, 
                password: hashedPassword,
                code,
            });
            res.status(201).json({ message: 'Personnel (Admin) created successfully' });
        } else if (userType === 'patient') {
            // เพิ่มข้อมูล patient ลงในตาราง Patient
            if (!dateOfBirth || !gender) {
                return res.status(400).json({ message: 'Date of Birth and Gender are required for patients.' });
            }
            await Patient.create({
                username,
                email, 
                password: hashedPassword,
                dateOfBirth,
                gender,
            });
            res.status(201).json({ message: 'Patient created successfully' });
        } else {
            // กรณีที่ userType ไม่ถูกต้อง
            res.status(400).json({ message: 'Invalid user type' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// เข้าสู่ระบบผู้ใช้
router.post('/login', async (req, res) => {
    const { username, email, password, code } = req.body;

    try {
        let user = null;
        let isAdmin = false;
        let adminCode = null;
        let patientId = null;
        let gender = null;
        let ageRange = null;

        if (code) {
            // ตรวจสอบผู้ใช้จากตาราง Admins
            user = await Admin.findOne({ where: { username } });

            if (!user) {
                return res.status(400).json({ message: 'Admin not found' });
            }

            // ตรวจสอบ admin code
            if (user.code !== code) {
                return res.status(400).json({ message: 'Invalid admin credentials or code' });
            }

            isAdmin = true;
            adminCode = user.code;
        } else {
            // หากไม่กรอก code ให้ตรวจสอบในตาราง Patients
            user = await Patient.findOne({ where: { username } });

            if (!user) {
                return res.status(400).json({ message: 'Patient not found' });
            }

            // กรณี Patient กรอก code admin
            if (code) {
                return res.status(403).json({ message: 'Access Denied: Patients cannot use admin code' });
            }

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

        // ตรวจสอบรหัสผ่าน
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // สร้าง token
        const token = jwt.sign(
            {
                id: isAdmin ? user.admin_id : patientId,
                userType: isAdmin ? 'admin' : 'patient',
                adminCode,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // ส่งข้อมูลกลับไปยัง frontend
        return res.status(200).json({
            token,
            isAdmin,
            patient_id: patientId,
            gender,
            ageRange,
            adminCode,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;