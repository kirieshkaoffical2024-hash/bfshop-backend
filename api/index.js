const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is not set!');
    throw new Error('DATABASE_URL environment variable is required');
}

// Parse connection string to add required Supabase pooler options
const poolConfig = {
    connectionString,
    ssl: { rejectUnauthorized: false },
    // Optimized for Vercel serverless functions
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        console.error('Check your DATABASE_URL in Vercel environment variables');
    } else {
        console.log('✅ Database connected successfully at', res.rows[0].now);
    }
});

// Middleware - CORS должен быть первым!
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await pool.query(
            'SELECT id, username, email, avatar_url, balance_fruits, rating, is_admin, is_banned FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        
        req.user = result.rows[0];
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Неверный токен' });
    }
};

// Admin middleware
const adminMiddleware = async (req, res, next) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }
    next();
};

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Укажите логин и пароль' });
        }

        // Проверка существующего username
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }

        // Проверка email только если он указан
        const emailValue = email && email.trim() !== '' ? email.trim() : null;
        if (emailValue) {
            const existingEmail = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [emailValue]
            );
            if (existingEmail.rows.length > 0) {
                return res.status(400).json({ error: 'Email уже используется' });
            }
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, email, balance_fruits) VALUES ($1, $2, $3, $4) RETURNING id, username, email, avatar_url, balance_fruits, rating',
            [username, passwordHash, emailValue, '{}']
        );
        
        const user = result.rows[0];
        
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.json({
            message: 'Регистрация успешна',
            token,
            user
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Ошибка регистрации' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Укажите логин и пароль' });
        }
        
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        
        const user = result.rows[0];
        
        if (user.is_banned) {
            return res.status(403).json({ error: 'Вы забанены' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        
        const token = jwt.sign(
            { userId: user.id, username: user.username, is_admin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.json({
            message: 'Вход выполнен',
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
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

// ============================================
// USER ROUTES
// ============================================

// Get user profile
app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, avatar_url, rating, total_reviews, created_at FROM users WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json({ user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки профиля' });
    }
});

// Search users
app.get('/api/users/search/:query', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, avatar_url FROM users WHERE username ILIKE $1 LIMIT 10',
            [`%${req.params.query}%`]
        );
        
        res.json({ users: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка поиска' });
    }
});

// ============================================
// LISTING ROUTES
// ============================================

// Get all listings
app.get('/api/listings', async (req, res) => {
    try {
        const { type, search } = req.query;
        
        let query = `
            SELECT l.*, u.username as seller_name, u.rating as seller_rating
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
            query += ` AND l.title ILIKE $${params.length}`;
        }
        
        query += ' ORDER BY l.created_at DESC';
        
        const result = await pool.query(query, params);
        
        res.json({ listings: result.rows });
    } catch (error) {
        console.error('Get listings error:', error);
        res.status(500).json({ error: 'Ошибка загрузки объявлений' });
    }
});

// Get single listing
app.get('/api/listings/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT l.*, u.username as seller_name, u.rating as seller_rating, u.avatar_url as seller_avatar
             FROM listings l
             JOIN users u ON l.seller_id = u.id
             WHERE l.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Объявление не найдено' });
        }
        
        await pool.query('UPDATE listings SET views = views + 1 WHERE id = $1', [req.params.id]);
        
        res.json({ listing: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки объявления' });
    }
});

// Create listing
app.post('/api/listings', authMiddleware, async (req, res) => {
    try {
        const { type, title, description, price_fruit, price_amount, details, account_data } = req.body;
        
        if (!type || !title || !price_fruit || !price_amount) {
            return res.status(400).json({ error: 'Заполните все поля' });
        }
        
        const result = await pool.query(
            `INSERT INTO listings (seller_id, type, title, description, price_fruit, price_amount, details, account_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [req.user.id, type, title, description, price_fruit, price_amount, JSON.stringify(details), account_data]
        );
        
        res.json({ message: 'Объявление создано', listing: result.rows[0] });
    } catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ error: 'Ошибка создания объявления' });
    }
});

// ============================================
// ORDER ROUTES
// ============================================

// Create order
app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        const { listing_id, fruit_offered, fruit_amount } = req.body;
        
        const listing = await pool.query('SELECT * FROM listings WHERE id = $1', [listing_id]);
        
        if (listing.rows.length === 0) {
            return res.status(404).json({ error: 'Объявление не найдено' });
        }
        
        const result = await pool.query(
            `INSERT INTO orders (listing_id, buyer_id, seller_id, fruit_offered, fruit_amount, status)
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
            [listing_id, req.user.id, listing.rows[0].seller_id, fruit_offered, fruit_amount]
        );
        
        const order = result.rows[0];
        
        // Автоматически создаём системное сообщение в чате
        await pool.query(
            `INSERT INTO chat_messages (order_id, sender_id, message, is_system)
             VALUES ($1, $2, $3, true)`,
            [
                order.id,
                req.user.id,
                `🎉 Новый заказ создан!\n\n📦 Товар: ${listing.rows[0].title}\n💰 Цена: ${fruit_amount}x ${fruit_offered}\n\n👤 Покупатель: ${req.user.username}\n\nПродавец, пожалуйста, свяжитесь с покупателем для завершения сделки.`
            ]
        );
        
        res.json({ message: 'Заказ создан', order });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Ошибка создания заказа' });
    }
});

// Get single order
app.get('/api/orders/:id', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, l.title as listing_title, l.type as listing_type,
             buyer.username as buyer_name, seller.username as seller_name
             FROM orders o
             JOIN listings l ON o.listing_id = l.id
             JOIN users buyer ON o.buyer_id = buyer.id
             JOIN users seller ON o.seller_id = seller.id
             WHERE o.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }
        
        const order = result.rows[0];
        
        // Check access
        if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
        
        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Ошибка загрузки заказа' });
    }
});

// Get user orders
app.get('/api/orders', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, l.title as listing_title, 
             buyer.username as buyer_name, seller.username as seller_name
             FROM orders o
             JOIN listings l ON o.listing_id = l.id
             JOIN users buyer ON o.buyer_id = buyer.id
             JOIN users seller ON o.seller_id = seller.id
             WHERE o.buyer_id = $1 OR o.seller_id = $1
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        
        res.json({ orders: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки заказов' });
    }
});

// Confirm payment
app.post('/api/orders/:id/confirm', authMiddleware, async (req, res) => {
    try {
        const order = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
        
        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }
        
        if (order.rows[0].seller_id !== req.user.id) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
        
        await pool.query(
            `UPDATE orders SET status = 'completed', account_data_revealed = true, completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [req.params.id]
        );
        
        res.json({ message: 'Оплата подтверждена' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка подтверждения' });
    }
});

// ============================================
// REVIEW ROUTES
// ============================================

// Create review
app.post('/api/reviews', authMiddleware, async (req, res) => {
    try {
        const { order_id, reviewed_user_id, rating, comment } = req.body;
        
        if (rating < 0 || rating > 5) {
            return res.status(400).json({ error: 'Рейтинг от 0 до 5' });
        }
        
        await pool.query(
            `INSERT INTO reviews (order_id, reviewer_id, reviewed_user_id, rating, comment)
             VALUES ($1, $2, $3, $4, $5)`,
            [order_id, req.user.id, reviewed_user_id, rating, comment]
        );
        
        const avgResult = await pool.query(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewed_user_id = $1',
            [reviewed_user_id]
        );
        
        await pool.query(
            'UPDATE users SET rating = $1, total_reviews = $2 WHERE id = $3',
            [avgResult.rows[0].avg_rating, avgResult.rows[0].total, reviewed_user_id]
        );
        
        res.json({ message: 'Отзыв добавлен' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка добавления отзыва' });
    }
});

// Get user reviews
app.get('/api/reviews/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, u.username as reviewer_name
             FROM reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.reviewed_user_id = $1
             ORDER BY r.created_at DESC`,
            [req.params.userId]
        );
        
        res.json({ reviews: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки отзывов' });
    }
});

// ============================================
// SUPPORT ROUTES
// ============================================

// Create support ticket
app.post('/api/support/tickets', authMiddleware, async (req, res) => {
    try {
        const { reported_user_id, order_id, reason, description } = req.body;
        
        const result = await pool.query(
            `INSERT INTO support_tickets (reporter_id, reported_user_id, order_id, reason, description)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.user.id, reported_user_id, order_id, reason, description]
        );
        
        res.json({ message: 'Жалоба отправлена', ticket: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка отправки жалобы' });
    }
});

// Get all tickets (admin)
app.get('/api/support/tickets/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, 
             reporter.username as reporter_name,
             reported.username as reported_user_name
             FROM support_tickets t
             JOIN users reporter ON t.reporter_id = reporter.id
             JOIN users reported ON t.reported_user_id = reported.id
             ORDER BY t.created_at DESC`
        );
        
        res.json({ tickets: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки жалоб' });
    }
});

// Ban user (admin)
app.post('/api/support/ban', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { user_id, reason, duration_days } = req.body;
        
        let expires_at = null;
        if (duration_days) {
            expires_at = new Date();
            expires_at.setDate(expires_at.getDate() + duration_days);
        }
        
        await pool.query(
            `INSERT INTO banned_users (user_id, banned_by, reason, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [user_id, req.user.id, reason, expires_at]
        );
        
        await pool.query('UPDATE users SET is_banned = true WHERE id = $1', [user_id]);
        
        res.json({ message: 'Пользователь забанен' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка бана' });
    }
});

// Get banned users (admin)
app.get('/api/support/banned', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT b.*, 
             u.username as banned_username,
             admin.username as banned_by_name
             FROM banned_users b
             JOIN users u ON b.user_id = u.id
             JOIN users admin ON b.banned_by = admin.id
             WHERE b.is_active = true
             ORDER BY b.banned_at DESC`
        );
        
        res.json({ banned_users: result.rows });
    } catch (error) {
        console.error('Get banned users error:', error);
        res.status(500).json({ error: 'Ошибка загрузки списка' });
    }
});

// Unban user (admin)
app.post('/api/support/unban', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { user_id } = req.body;
        
        await pool.query('UPDATE banned_users SET is_active = false WHERE user_id = $1', [user_id]);
        await pool.query('UPDATE users SET is_banned = false WHERE id = $1', [user_id]);
        
        res.json({ message: 'Пользователь разбанен' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка разбана' });
    }
});

// Get all users (admin)
app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, avatar_url, rating, total_reviews, is_admin, is_banned, created_at
             FROM users
             ORDER BY created_at DESC
             LIMIT 100`
        );
        
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Ошибка загрузки пользователей' });
    }
});

// Search users (admin)
app.get('/api/users/search', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { username } = req.query;
        
        const result = await pool.query(
            `SELECT id, username, email, avatar_url, rating, total_reviews, is_admin, is_banned, created_at
             FROM users
             WHERE username ILIKE $1
             ORDER BY username
             LIMIT 20`,
            [`%${username}%`]
        );
        
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Ошибка поиска' });
    }
});
            [user_id, req.user.id, reason, expires_at]
        );
        
        await pool.query('UPDATE users SET is_banned = true WHERE id = $1', [user_id]);
        
        res.json({ message: 'Пользователь забанен' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка бана' });
    }
});

// ============================================
// CHAT ROUTES
// ============================================

// Get chat messages
app.get('/api/chat/:orderId', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.*, u.username as sender_name
             FROM chat_messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.order_id = $1
             ORDER BY m.created_at ASC`,
            [req.params.orderId]
        );
        
        res.json({ messages: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки сообщений' });
    }
});

// Send message
app.post('/api/chat/:orderId', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        
        const result = await pool.query(
            `INSERT INTO chat_messages (order_id, sender_id, message)
             VALUES ($1, $2, $3) RETURNING *`,
            [req.params.orderId, req.user.id, message]
        );
        
        res.json({ message: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка отправки сообщения' });
    }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'BFshop API', status: 'running' });
});

// Export for Vercel
module.exports = app;
