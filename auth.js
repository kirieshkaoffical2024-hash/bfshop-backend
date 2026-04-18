const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({ error: 'Username must be 3-50 characters' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user
        const result = await db.query(
            'INSERT INTO users (username, password_hash, email, balance_fruits) VALUES ($1, $2, $3, $4) RETURNING id, username, email, avatar_url, balance_fruits, rating, created_at',
            [username, passwordHash, email, '{}']
        );
        
        const user = result.rows[0];
        
        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        // Save session
        req.session.token = token;
        req.session.userId = user.id;
        
        res.json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                balance_fruits: user.balance_fruits,
                rating: user.rating
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Укажите логин и пароль' });
        }
        
        // Find user
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        
        const user = result.rows[0];
        
        // Проверка бана
        if (user.is_banned) {
            const banInfo = await db.query(
                `SELECT * FROM banned_users 
                 WHERE user_id = $1 AND is_active = true
                 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
                [user.id]
            );
            
            if (banInfo.rows.length > 0) {
                const ban = banInfo.rows[0];
                const message = ban.expires_at 
                    ? `Вы забанены до ${new Date(ban.expires_at).toLocaleDateString('ru-RU')}. Причина: ${ban.reason}`
                    : `Вы забанены навсегда. Причина: ${ban.reason}`;
                return res.status(403).json({ error: message });
            }
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        
        // Update last login
        await db.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username, is_admin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        // Save session
        req.session.token = token;
        req.session.userId = user.id;
        
        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                balance_fruits: user.balance_fruits,
                rating: user.rating,
                is_admin: user.is_admin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка входа' });
    }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
