const express = require('express');
const router = express.Router();
const axios = require('axios');

// ดึง token จาก .env
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramApiUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

// ฟังก์ชันเพื่อส่ง Telegram ID กลับไปยังผู้ใช้
const getUserID = async (chatId) => {
  try {
    const message = 'Your Telegram ID is: ' + chatId;
    await axios.post(telegramApiUrl, {
      chat_id: chatId,
      text: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// รับ webhook จาก Telegram
router.post('/telegram-webhook', (req, res) => {
    const chatId = req.body.message.chat.id;
    const text = req.body.message.text; // ดึงข้อความที่ส่งมา
  
    if (text === '/start') {
      getUserID(chatId);  // ส่ง Telegram ID กลับไปหาผู้ใช้
    }
  
    res.sendStatus(200);  // ตอบกลับสถานะ HTTP 200 OK
  });
  

module.exports = router;
