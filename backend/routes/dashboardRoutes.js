const express = require("express");
const moment = require("moment");
const { Op } = require("sequelize");
const Patient = require("../models/Users");

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    // นับจำนวนผู้ใช้งานทั้งหมด
    const totalPatients = await Patient.count();

    // นับจำนวนผู้ใช้งานแยกตามเพศ
    const malePatients = await Patient.count({ where: { gender: 'male' } });
    const femalePatients = await Patient.count({ where: { gender: 'female' } });
    const otherPatients = await Patient.count({ where: { gender: 'other' } }); // เพิ่มการนับเพศ other

    // นับจำนวนผู้ใช้งานแยกตามช่วงอายุ
    const currentDate = moment();
    const ageGroups = {
      '13-19': 0,
      '20-39': 0,
      '40-59': 0,
      '60-120': 0,
    };

    const patients = await Patient.findAll();
    patients.forEach(patient => {
      const age = currentDate.diff(moment(patient.dateOfBirth), 'years');
      if (age >= 13 && age <= 19) ageGroups['13-19']++;
      else if (age >= 20 && age <= 39) ageGroups['20-39']++;
      else if (age >= 40 && age <= 59) ageGroups['40-59']++;
      else if (age >= 60) ageGroups['60-120']++;
    });

    // ส่ง Response กลับ
    res.status(200).json({
      patientData: {
        total: totalPatients,
        male: malePatients,
        female: femalePatients,
        other: otherPatients, // รวมข้อมูลเพศ other ใน Response
        ageGroups,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
  }
});

module.exports = router;
