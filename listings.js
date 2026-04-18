const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all listings
router.get('/', async (req, res) => {
    try {
        const { type, search, sort = 'created_at', order = 'DESC' } = req.query;
        
        let query = `
            SELECT l.*, u.username as seller_name, u.avatar_url as seller_avatar, u.rating as seller_rating
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            WHERE l.status = 'active'
        `;
        const params = [];
        
        if (type) {
            params.push(type);
            query += ` AND l.type = $${params.length}`;
        }
        
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`;
        }
        
        query += ` ORDER BY l.${sort} ${order}`;
        
        const result = await db.query(query, params);
        res.json({ listings: result.rows });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ error: 'Failed to fetch listings' });
    }
});

// Get single listing
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT l.*, u.username as seller_name, u.avatar_url as seller_avatar, u.rating as seller_rating, u.total_reviews
             FROM listings l
             JOIN users u ON l.seller_id = u.id
             WHERE l.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        
        // Increment views
        await db.query('UPDATE listings SET views = views + 1 WHERE id = $1', [req.params.id]);
        
        res.json({ listing: result.rows[0] });
    } catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({ error: 'Failed to fetch listing' });
    }
});

// Create listing
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { type, title, description, price_fruit, price_amount, details, images, account_data } = req.body;
        
        if (!type || !title || !price_fruit || !price_amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Для аккаунтов требуются данные
        if (type === 'account' && !account_data) {
            return res.status(400).json({ error: 'Account data is required for account listings' });
        }
        
        const result = await db.query(
            `INSERT INTO listings (seller_id, type, title, description, price_fruit, price_amount, details, images, account_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [req.user.id, type, title, description, price_fruit, price_amount, JSON.stringify(details || {}), JSON.stringify(images || []), account_data || null]
        );
        
        res.json({ listing: result.rows[0] });
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ error: 'Failed to create listing' });
    }
});

// Update listing
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, description, price_fruit, price_amount, status } = req.body;
        
        // Check ownership
        const check = await db.query('SELECT seller_id FROM listings WHERE id = $1', [req.params.id]);
        if (check.rows.length === 0 || check.rows[0].seller_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await db.query(
            `UPDATE listings SET title = $1, description = $2, price_fruit = $3, price_amount = $4, status = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 RETURNING *`,
            [title, description, price_fruit, price_amount, status, req.params.id]
        );
        
        res.json({ listing: result.rows[0] });
    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({ error: 'Failed to update listing' });
    }
});

// Delete listing
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const check = await db.query('SELECT seller_id FROM listings WHERE id = $1', [req.params.id]);
        if (check.rows.length === 0 || check.rows[0].seller_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        await db.query('UPDATE listings SET status = $1 WHERE id = $2', ['cancelled', req.params.id]);
        res.json({ message: 'Listing deleted' });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({ error: 'Failed to delete listing' });
    }
});

module.exports = router;
