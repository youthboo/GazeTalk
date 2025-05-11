const express = require('express');
const router = express.Router();
const Patient = require('../models/Users'); 
const Message = require('../models/Message'); 
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
// ลบผู้ป่วย (โดยลบข้อความที่เกี่ยวข้องก่อน)
router.delete('/patients/:patient_id', async (req, res) => {
  const { patient_id } = req.params;

  try {
    // หาผู้ป่วยจาก patient_id
    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({ message: 'ไม่พบผู้ป่วยที่ต้องการลบ' });
    }

    // 🔸 ลบข้อความทั้งหมดที่อ้างถึง patient_id นี้ก่อน
    const deletedMessages = await Message.destroy({
      where: { patient_id },
    });

    if (deletedMessages === 0) {
      console.log('ไม่พบข้อความที่เกี่ยวข้องกับผู้ป่วย');
    }

    // 🔸 ลบผู้ป่วย
    await patient.destroy();

    res.status(200).json({ message: 'ลบข้อมูลผู้ป่วยและข้อความที่เกี่ยวข้องสำเร็จ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'มีข้อผิดพลาดในการลบข้อมูลผู้ป่วย' });
  }
});

module.exports = router;
