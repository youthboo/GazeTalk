const express = require('express');
const RecommendedWord = require('../models/RecommendedWord'); 
const router = express.Router();

router.get('/', async (req, res) => {
  const { gender, ageRange } = req.query;  
  
  try {
    const words = await RecommendedWord.findAll({
      where: {
        gender: gender,  
        age_range: ageRange,  
      },
    });
    
    res.json({ words: words.map(word => word.word) }); 
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลคำได้', error: error.message });
  }
});

// Route สำหรับอัพเดตคำในฐานข้อมูล
router.put('/update', async (req, res) => {
  const { gender, ageRange, oldWord, newWord } = req.body;  

  try {
    const wordToUpdate = await RecommendedWord.findOne({
      where: {
        gender: gender,  
        age_range: ageRange, 
        word: oldWord,  
      },
    });

    if (!wordToUpdate) {
      return res.status(404).json({ message: 'ไม่พบคำที่ต้องการอัพเดต' });
    }

    await wordToUpdate.update({ word: newWord });

    res.status(200).json({ message: 'อัพเดตคำสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถอัพเดตคำได้', error: error.message });
  }
});

module.exports = router;
