const express = require('express');
const cors = require('cors');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const db = require('./database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const listingRoutes = require('./routes/listings');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const chatRoutes = require('./routes/chat');
const supportRoutes = require('./routes/support');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:8080',
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/support', supportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// WebSocket for real-time chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-chat', (orderId) => {
        socket.join(`order-${orderId}`);
        console.log(`User joined chat for order ${orderId}`);
    });
    
    socket.on('send-message', async (data) => {
        const { orderId, senderId, message } = data;
        
        try {
            // Save message to database
            const result = await db.query(
                'INSERT INTO chat_messages (order_id, sender_id, message) VALUES ($1, $2, $3) RETURNING *',
                [orderId, senderId, message]
            );
            
            // Broadcast to room
            io.to(`order-${orderId}`).emit('new-message', result.rows[0]);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 BFshop server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
