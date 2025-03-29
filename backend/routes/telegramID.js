const express = require('express');
const router = express.Router();
const axios = require('axios');

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramApiUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

// ส่งข้อความไปยังผู้ใช้
const sendMessage = async (chatId, message) => {
  try {
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
  const text = req.body.message.text;

  if (text === '/start') {
    const message = `ยินดีต้อนรับสู่ GazeTalk! ID ของคุณคือ ${chatId}\n\nกรุณาพิมพ์ /info เพื่อดูข้อมูลเกี่ยวกับ GazeTalk หรือ /help เพื่อขอคำแนะนำการใช้งาน`;
    sendMessage(chatId, message);  
  } else if (text === '/info') {
    const message = `
    GazeTalk เป็นแอปพลิเคชันที่สร้างขึ้นมาเพื่อให้ผู้เกี่ยวข้องกับผู้ป่วยอย่างเช่น ญาติ หรือผู้ดูแลสามารถรับข้อความแจ้งเตือนจากผู้ป่วยได้ โดยมีการแบ่ง role ในการรับข้อความจากผู้ป่วยเป็น 3 ประเภท ได้แก่:
    
    - Notifier: ผู้ที่มีสามารถรับได้เฉพาะข้อความแจ้งเตือนฉุกเฉินจากผู้ป่วยเท่านั้น
    - Receiver: ผู้ที่สามารถรับได้เฉพาะข้อความทั่วไปจากผู้ป่วยเท่านั้น
    - Notifier/Receiver: ผู้ที่สามารถรับข้อความแจ้งเตือนฉุกเฉินและรับข้อความทั่วไปจากผู้ป่วยได้
    
    GazeTalk Bot ของเราจะตอบกลับข้อความให้ตาม role ของคุณ
    `;
    sendMessage(chatId, message);  
  } else if (text === '/help') {
    const message = 'คำสั่งที่สามารถใช้ได้:\n/start - เริ่มต้นใช้งานบอท\n/info - ดูข้อมูลเกี่ยวกับแอป\n/help - ข้อมูลเพิ่มเติมเกี่ยวกับวิธีใช้งาน';
    sendMessage(chatId, message);  
  } else {
    const message = 'คำสั่งไม่ถูกต้อง กรุณาพิมพ์ /start, /info หรือ /help เพื่อดูข้อมูลเพิ่มเติม';
    sendMessage(chatId, message);  
  }

  res.sendStatus(200);  
});

module.exports = router;
