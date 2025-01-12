const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment'); // ใช้ moment สำหรับคำนวณอายุ
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // ใช้สำหรับสร้าง token
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

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        if (userType === 'personnel') {
            // เพิ่มข้อมูล personnel ลงในตาราง Admin
            if (!code) {
                return res.status(400).json({ message: 'Code is required for personnel.' });
            }
            await Admin.create({
                username,
                email, // เพิ่ม email
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
                email, // เพิ่ม email
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

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // ตรวจสอบว่าอีเมลมีอยู่หรือไม่
        const user = 
            await Admin.findOne({ where: { email } }) || 
            await Patient.findOne({ where: { email } });
        
        if (!user) {
            return res.status(404).json({ message: 'Email not found.' });
        }

        // สร้าง reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // กำหนด token ให้ user และตั้งค่าหมดอายุ (ตัวอย่าง: 1 ชั่วโมง)
        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 ชั่วโมง
        await user.save();

        // ส่งอีเมล
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // หรือบริการอื่น เช่น SendGrid
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetLink = `http://localhost:3008/reset-password/${resetToken}`;

        await transporter.sendMail({
            to: email,
            from: 'yourapp@example.com',
            subject: 'Password Reset',
            html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="${resetLink}">link</a> to set a new password.</p>
            `,
        });

        res.status(200).json({ message: 'Password reset link has been sent to your email.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    try {
        // ค้นหา user จาก resetToken
        const user = 
            await Admin.findOne({ 
                where: { 
                    resetToken: token,
                    resetTokenExpiration: { [Op.gt]: Date.now() }
                }
            }) || 
            await Patient.findOne({ 
                where: { 
                    resetToken: token,
                    resetTokenExpiration: { [Op.gt]: Date.now() }
                }
            });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // อัปเดตรหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // อัปเดตข้อมูลและล้าง token
        await user.update({ 
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiration: null
        });

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
