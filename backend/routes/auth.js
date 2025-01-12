const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment'); // ใช้ moment สำหรับคำนวณอายุ
const Patient = require('../models/Users');
const Admin = require('../models/Admin');

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
    const { username, password, dateOfBirth, gender, code, userType } = req.body;

    try {
        // ตรวจสอบว่า username ซ้ำหรือไม่
        const existingUser =
            await Admin.findOne({ where: { username } }) ||
            await Patient.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
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
    const { username, password, code } = req.body;

    try {
        let user;
        let isAdmin = false;
        let adminCode = null;
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
            adminCode = user.code;
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
            { 
                id: isAdmin ? user.admin_id : user.patient_id, 
                userType: isAdmin ? 'admin' : 'patient',
                adminCode: adminCode // เพิ่ม adminCode ลงใน token
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({ token, isAdmin, patient_id: patientId, gender, ageRange, adminCode });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ตัวอย่าง Routes ที่ใช้ Middleware
router.get('/admin/dashboard', authorizeAdmin(['SKCode55', 'SecretCodeAdmin']), (req, res) => {
    res.json({ message: 'Dashboard accessible' });
});

router.get('/admin/addline', authorizeAdmin(['SKCode55', 'SecretCodeAdmin']), (req, res) => {
    res.json({ message: 'Add Relative ID accessible' });
});

router.get('/admin/editword', authorizeAdmin(['SKCode55']), (req, res) => {
    res.json({ message: 'Edit Word accessible' });
});

module.exports = router;
