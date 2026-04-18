const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT u.id, u.username, u.avatar_url, u.rating, u.total_reviews, u.created_at,
             COUNT(DISTINCT l.id) as total_listings,
             COUNT(DISTINCT o.id) as total_sales
             FROM users u
             LEFT JOIN listings l ON l.seller_id = u.id
             LEFT JOIN orders o ON o.seller_id = u.id AND o.status = 'completed'
             WHERE u.id = $1 AND u.is_active = true
             GROUP BY u.id`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update profile
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const { email } = req.body;
        
        const result = await db.query(
            'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, avatar_url',
            [email, req.user.id]
        );
        
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Upload avatar
router.post('/:id/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        if (req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const avatarUrl = `/uploads/${req.file.filename}`;
        
        await db.query(
            'UPDATE users SET avatar_url = $1 WHERE id = $2',
            [avatarUrl, req.user.id]
        );
        
        res.json({ avatar_url: avatarUrl });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// Search users by username
router.get('/search', async (req, res) => {
    try {
        const { username } = req.query;
        
        if (!username) {
            return res.status(400).json({ error: 'Username query required' });
        }
        
        const result = await db.query(
            `SELECT id, username, avatar_url, rating, total_reviews, is_admin, is_banned, created_at
             FROM users
             WHERE username ILIKE $1 AND is_active = true
             LIMIT 20`,
            [`%${username}%`]
        );
        
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Get all users (admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Check if admin
        if (!req.user.is_admin) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await db.query(
            `SELECT id, username, email, avatar_url, rating, total_reviews, is_admin, is_banned, created_at, last_login
             FROM users
             WHERE is_active = true
             ORDER BY created_at DESC`
        );
        
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
