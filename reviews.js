const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user reviews
router.get('/:userId', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT r.*, u.username as reviewer_name, u.avatar_url as reviewer_avatar
             FROM reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.reviewed_user_id = $1
             ORDER BY r.created_at DESC`,
            [req.params.userId]
        );
        
        res.json({ reviews: result.rows });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Create review
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { order_id, rating, comment } = req.body;
        
        if (!order_id || rating === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (rating < 0 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 0 and 5' });
        }
        
        // Get order
        const order = await db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.rows[0].buyer_id !== req.user.id) {
            return res.status(403).json({ error: 'Only buyer can leave review' });
        }
        
        if (order.rows[0].status !== 'completed') {
            return res.status(400).json({ error: 'Order must be completed' });
        }
        
        const reviewed_user_id = order.rows[0].seller_id;
        
        // Check if review already exists
        const existing = await db.query('SELECT id FROM reviews WHERE order_id = $1', [order_id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Review already exists' });
        }
        
        // Create review
        const result = await db.query(
            `INSERT INTO reviews (order_id, reviewer_id, reviewed_user_id, rating, comment)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [order_id, req.user.id, reviewed_user_id, rating, comment]
        );
        
        // Update user rating
        await db.query(
            `UPDATE users SET 
             rating = (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = $1),
             total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = $1)
             WHERE id = $1`,
            [reviewed_user_id]
        );
        
        res.json({ review: result.rows[0] });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

module.exports = router;
