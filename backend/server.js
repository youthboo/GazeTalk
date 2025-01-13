const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise'); 
const sequelize = require('./db'); 
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patientRoutes'); 
const messageRoutes = require('./routes/messageRoutes'); 
const telegramIDRoutes = require('./routes/telegramID');
const relativeRoutes = require('./routes/relativeRoutes'); 
const dashboardRoutes = require("./routes/dashboardRoutes"); 
const sendMessageRoute = require('./routes/sendMessageRoute');
const wordsRoute = require('./routes/words');

const app = express();

// Middleware
app.use(cors({
    origin: '*',  
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', patientRoutes); 
app.use('/api/messages', messageRoutes);
app.use('/api/telegram', telegramIDRoutes); 
app.use('/api/relative', relativeRoutes); 
app.use("/api/dashboard", dashboardRoutes);
app.use('/api', sendMessageRoute);
app.use('/api/words', wordsRoute);

// Function to create database if not exists
const createDatabaseIfNotExists = async () => {
    try {
        // สร้างการเชื่อมต่อโดยตรงกับ MySQL
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        // สร้างฐานข้อมูล GazeTalk
        await connection.query('CREATE DATABASE IF NOT EXISTS GazeTalk');
        console.log('Database created or already exists.');

        // ปิดการเชื่อมต่อ
        await connection.end();
    } catch (error) {
        console.error('Error creating database:', error);
        process.exit(1); 
    }
};

createDatabaseIfNotExists()
    .then(() => sequelize.sync())
    .then(() => {
        console.log('Database synchronized');
        const PORT = process.env.PORT || 3008;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error synchronizing database:', error);
    });
