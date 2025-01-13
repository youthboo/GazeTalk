const express = require('express');
const router = express.Router();
const Patient = require('../models/Users'); 
const RelativeChatID = require('../models/RelativeChatID'); 

// Route เพื่อดึงข้อมูลผู้ป่วยทั้งหมด
router.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.findAll();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'มีข้อผิดพลาดในการดึงข้อมูลผู้ป่วย', error });
  }
});

// ใช้ patient_id แทนที่ id
router.delete('/patients/:patient_id', async (req, res) => {
  const { patient_id } = req.params;  
  
  try {
    const patient = await Patient.findByPk(patient_id); 
    if (!patient) {
      return res.status(404).json({ message: 'ไม่พบผู้ป่วยที่ต้องการลบ' });
    }
    
    await patient.destroy();  
    res.status(200).json({ message: 'ลบข้อมูลผู้ป่วยสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'มีข้อผิดพลาดในการลบข้อมูลผู้ป่วย' });
  }
});

module.exports = router;
