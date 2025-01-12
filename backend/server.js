const express = require('express');
const cors = require('cors');
require('dotenv').config();
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

// Sync the database
sequelize.sync()
    .then(() => console.log('Database synchronized'))
    .catch((error) => console.error('Error synchronizing database:', error));

// Start the server
const PORT = process.env.PORT || 3008;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
