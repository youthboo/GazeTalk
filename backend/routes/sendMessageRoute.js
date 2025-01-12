const express = require('express');
const router = express.Router();
const RelativeChatID = require('../models/RelativeChatID');
const axios = require('axios');

// ดึง token จาก .env
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramApiUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

// ฟังก์ชันเพื่อส่งข้อความไปยัง Telegram ID ของญาติผู้ป่วย
const sendMessageToRelative = async (chatId, message) => {
  try {
    await axios.post(telegramApiUrl, {
      chat_id: chatId,
      text: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// เส้นทางสำหรับผู้ป่วยเพื่อส่งข้อความไปยังญาติ
router.post('/patients/:patient_id/send-message', async (req, res) => {
  const { patient_id } = req.params;
  const { message } = req.body;

  try {
    // ค้นหา telegramID ของญาติทั้งหมดที่มี patient_id ตรงกัน
    const relatives = await RelativeChatID.findAll({
      where: { patient_id }
    });

    if (relatives.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลญาติของผู้ป่วยคนนี้' });
    }

    // ส่งข้อความไปยัง Telegram ของญาติแต่ละคน
    for (const relative of relatives) {
      await sendMessageToRelative(relative.telegramID, message);
    }

    res.status(200).json({ message: 'ส่งข้อความไปยังญาติของผู้ป่วยเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error sending message to relatives:', error);
    res.status(500).json({ message: 'มีข้อผิดพลาดในการส่งข้อความ', error });
  }
});

module.exports = router;
