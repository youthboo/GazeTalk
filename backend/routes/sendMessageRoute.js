const express = require('express');
const router = express.Router();
const RelativeChatID = require('../models/RelativeChatID');
const axios = require('axios');

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
    // ค้นหา telegramID และ role ของญาติทั้งหมดที่มี patient_id ตรงกัน
    const relatives = await RelativeChatID.findAll({
      where: { patient_id },
      attributes: ['telegramID', 'role'] 
    });

    if (relatives.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลญาติของผู้ป่วยคนนี้' });
    }

    const isEmergency = message.includes('แจ้งเตือนฉุกเฉิน');

    const errors = [];
    for (const relative of relatives) {
      const { telegramID, role } = relative;

      // เงื่อนไขสำหรับ Notifier
      if (role === 'Notifier' && !isEmergency) {
        continue; 
      }

      // เงื่อนไขสำหรับ Receiver
      if (role === 'Receiver' && isEmergency) {
        continue; 
      }

      // เงื่อนไขสำหรับ Notifier/Receiver (รับได้ทั้งสองประเภท)
      if (role === 'Notifier/Receiver' || (role === 'Notifier' && isEmergency) || (role === 'Receiver' && !isEmergency)) {
        try {
          await sendMessageToRelative(telegramID, message);
        } catch (error) {
          console.error(`Error sending message to ${telegramID}:`, error);
          errors.push({ telegramID, error });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(500).json({
        message: 'ข้อความบางส่วนไม่สามารถส่งได้',
        errors
      });
    }

    res.status(200).json({ message: 'ส่งข้อความไปยังญาติของผู้ป่วยเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error sending message to relatives:', error);
    res.status(500).json({ message: 'มีข้อผิดพลาดในการส่งข้อความ', error });
  }
});


module.exports = router;
