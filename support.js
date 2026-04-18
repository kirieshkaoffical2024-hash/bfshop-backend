const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Middleware для проверки админа
const adminMiddleware = async (req, res, next) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Доступ запрещен. Только для администраторов.' });
    }
    next();
};

// Создать жалобу на скамера
router.post('/tickets', authMiddleware, async (req, res) => {
    try {
        const { reported_user_id, order_id, reason, description } = req.body;
        
        if (!reported_user_id || !reason) {
            return res.status(400).json({ error: 'Укажите пользователя и причину жалобы' });
        }
        
        // Проверяем что пользователь не жалуется сам на себя
        if (reported_user_id === req.user.id) {
            return res.status(400).json({ error: 'Нельзя пожаловаться на самого себя' });
        }
        
        // Проверяем существование пользователя
        const userCheck = await db.query('SELECT id, username FROM users WHERE id = $1', [reported_user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const result = await db.query(
            `INSERT INTO support_tickets (reporter_id, reported_user_id, order_id, reason, description, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.user.id, reported_user_id, order_id, reason, description, 'open']
        );
        
        res.json({ 
            message: 'Жалоба отправлена. Администратор рассмотрит её в ближайшее время.',
            ticket: result.rows[0] 
        });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({ error: 'Не удалось отправить жалобу' });
    }
});

// Получить свои жалобы
router.get('/tickets/my', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT t.*, 
             reporter.username as reporter_name,
             reported.username as reported_user_name,
             admin.username as admin_name
             FROM support_tickets t
             JOIN users reporter ON t.reporter_id = reporter.id
             JOIN users reported ON t.reported_user_id = reported.id
             LEFT JOIN users admin ON t.admin_id = admin.id
             WHERE t.reporter_id = $1
             ORDER BY t.created_at DESC`,
            [req.user.id]
        );
        
        res.json({ tickets: result.rows });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Не удалось загрузить жалобы' });
    }
});

// АДМИН: Получить все жалобы
router.get('/tickets/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT t.*, 
            reporter.username as reporter_name,
            reported.username as reported_user_name,
            admin.username as admin_name
            FROM support_tickets t
            JOIN users reporter ON t.reporter_id = reporter.id
            JOIN users reported ON t.reported_user_id = reported.id
            LEFT JOIN users admin ON t.admin_id = admin.id
        `;
        
        const params = [];
        if (status) {
            params.push(status);
            query += ` WHERE t.status = $1`;
        }
        
        query += ` ORDER BY t.created_at DESC`;
        
        const result = await db.query(query, params);
        
        res.json({ tickets: result.rows });
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        res.status(500).json({ error: 'Не удалось загрузить жалобы' });
    }
});

// АДМИН: Ответить на жалобу
router.post('/tickets/:id/respond', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { response, status } = req.body;
        
        if (!response) {
            return res.status(400).json({ error: 'Укажите ответ' });
        }
        
        await db.query(
            `UPDATE support_tickets 
             SET admin_response = $1, status = $2, admin_id = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [response, status || 'in_progress', req.user.id, req.params.id]
        );
        
        res.json({ message: 'Ответ отправлен' });
    } catch (error) {
        console.error('Error responding to ticket:', error);
        res.status(500).json({ error: 'Не удалось отправить ответ' });
    }
});

// АДМИН: Забанить пользователя
router.post('/ban', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { user_id, reason, duration_days } = req.body;
        
        if (!user_id || !reason) {
            return res.status(400).json({ error: 'Укажите пользователя и причину бана' });
        }
        
        // Нельзя забанить админа
        const userCheck = await db.query('SELECT is_admin FROM users WHERE id = $1', [user_id]);
        if (userCheck.rows.length > 0 && userCheck.rows[0].is_admin) {
            return res.status(403).json({ error: 'Нельзя забанить администратора' });
        }
        
        // Вычисляем дату окончания бана
        let expires_at = null;
        if (duration_days) {
            expires_at = new Date();
            expires_at.setDate(expires_at.getDate() + duration_days);
        }
        
        // Добавляем в таблицу банов
        await db.query(
            `INSERT INTO banned_users (user_id, banned_by, reason, expires_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE 
             SET reason = $3, expires_at = $4, banned_at = CURRENT_TIMESTAMP, is_active = true`,
            [user_id, req.user.id, reason, expires_at]
        );
        
        // Обновляем статус пользователя
        await db.query('UPDATE users SET is_banned = true WHERE id = $1', [user_id]);
        
        // Удаляем все активные сессии пользователя
        await db.query('DELETE FROM sessions WHERE user_id = $1', [user_id]);
        
        res.json({ 
            message: duration_days 
                ? `Пользователь забанен на ${duration_days} дней` 
                : 'Пользователь забанен навсегда'
        });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({ error: 'Не удалось забанить пользователя' });
    }
});

// АДМИН: Разбанить пользователя
router.post('/unban', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { user_id } = req.body;
        
        if (!user_id) {
            return res.status(400).json({ error: 'Укажите пользователя' });
        }
        
        await db.query('UPDATE banned_users SET is_active = false WHERE user_id = $1', [user_id]);
        await db.query('UPDATE users SET is_banned = false WHERE id = $1', [user_id]);
        
        res.json({ message: 'Пользователь разбанен' });
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).json({ error: 'Не удалось разбанить пользователя' });
    }
});

// АДМИН: Получить список забаненных
router.get('/banned', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await db.query(
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
        console.error('Error fetching banned users:', error);
        res.status(500).json({ error: 'Не удалось загрузить список банов' });
    }
});

// Проверить статус бана пользователя
router.get('/check-ban/:userId', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM banned_users 
             WHERE user_id = $1 AND is_active = true
             AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
            [req.params.userId]
        );
        
        if (result.rows.length > 0) {
            res.json({ 
                is_banned: true, 
                ban_info: result.rows[0] 
            });
        } else {
            res.json({ is_banned: false });
        }
    } catch (error) {
        console.error('Error checking ban status:', error);
        res.status(500).json({ error: 'Ошибка проверки бана' });
    }
});

module.exports = router;
