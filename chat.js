const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get chat messages
router.get('/:orderId', authMiddleware, async (req, res) => {
    try {
        // Check if user is part of order
        const order = await db.query(
            'SELECT * FROM orders WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
            [req.params.orderId, req.user.id]
        );
        
        if (order.rows.length === 0) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await db.query(
            `SELECT m.*, u.username as sender_name, u.avatar_url as sender_avatar
             FROM chat_messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.order_id = $1
             ORDER BY m.created_at ASC`,
            [req.params.orderId]
        );
        
        res.json({ messages: result.rows });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send message (also handled by WebSocket in server.js)
router.post('/:orderId', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }
        
        // Check if user is part of order
        const order = await db.query(
            'SELECT * FROM orders WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
            [req.params.orderId, req.user.id]
        );
        
        if (order.rows.length === 0) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await db.query(
            `INSERT INTO chat_messages (order_id, sender_id, message)
             VALUES ($1, $2, $3) RETURNING *`,
            [req.params.orderId, req.user.id, message]
        );
        
        res.json({ message: result.rows[0] });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;
