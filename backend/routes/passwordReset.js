const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const moment = require('moment');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Patient = require('../models/Users'); 
const Admin = require('../models/Admin'); 

dotenv.config();

const router = express.Router();

router.post('/forgot-password', async (req, res) => {
    const { email, userType } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // ค้นหาผู้ใช้จากฐานข้อมูล
        let user;
        if (userType === 'personnel') {
            user = await Admin.findOne({ where: { email } });
        } else if (userType === 'patient') {
            user = await Patient.findOne({ where: { email } });
        } else {
            return res.status(400).json({ message: 'Invalid user type' });
        }

        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // สร้าง token สำหรับรีเซ็ตรหัสผ่าน
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = moment().add(1, 'hour').toDate(); // Token มีอายุ 1 ชั่วโมง

        // อัปเดต token ในฐานข้อมูล
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // สร้าง transporter สำหรับส่งอีเมล
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST, // 'smtp.gmail.com'
            port: process.env.SMTP_PORT, // 465
            secure: process.env.SMTP_SECURE === 'true', // ใช้ SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // ลิงก์สำหรับรีเซ็ตรหัสผ่าน
        const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}/${userType}`;


        // ส่งอีเมลรีเซ็ตรหัสผ่าน
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset your password',
            html: `<p>Click the link below to reset your password. This link will expire in 1 hour.</p>
                   <a href="${resetLink}">${resetLink}</a>`
        });

        res.json({ message: 'Password reset link sent to email' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, userType, newPassword } = req.body;

    try {
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        // ค้นหาผู้ใช้ที่มี token และยังไม่หมดอายุ
        let user;
        if (userType === 'personnel') {
            user = await Admin.findOne({ where: { resetToken: token } });
        } else if (userType === 'patient') {
            user = await Patient.findOne({ where: { resetToken: token } });
        } else {
            return res.status(400).json({ message: 'Invalid user type' });
        }

        if (!user || user.resetTokenExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // เข้ารหัสรหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // อัปเดตรหัสผ่าน และล้าง token ออก
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        res.json({ message: 'Password has been reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
