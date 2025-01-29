const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || "",
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        define: {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        },
        dialect: 'mysql',
        logging: false, // ปิด log query ถ้าไม่จำเป็น
        retry: {
            match: [
                /ETIMEDOUT/,
                /ECONNREFUSED/,
                /EHOSTUNREACH/,
                /PROTOCOL_CONNECTION_LOST/,
                /SequelizeConnectionError/,
                /SequelizeHostNotFoundError/,
            ],
            max: 5 // ลองเชื่อมต่อใหม่สูงสุด 5 ครั้ง
        },
        pool: {
            max: 5, 
            min: 0,
            acquire: 30000, 
            idle: 10000 
        }
    }
);

const connectWithRetry = async () => {
    let retries = 5; // จำนวนครั้งสูงสุดที่ลองเชื่อมต่อ
    while (retries) {
        try {
            await sequelize.authenticate();
            console.log('Database connection established successfully');
            break; // เชื่อมต่อสำเร็จ ออกจาก loop
        } catch (error) {
            console.error('Failed to connect to the database. Retrying...', retries, error.message);
            retries -= 1;
            if (retries === 0) {
                console.error('Could not establish a connection to the database');
                throw error; 
            }
            await new Promise(res => setTimeout(res, 5000)); // รอ 5 วินาที ก่อนลองใหม่
        }
    }
};

connectWithRetry();

module.exports = sequelize;
