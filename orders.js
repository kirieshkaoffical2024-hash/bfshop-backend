const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user orders
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT o.*, l.title as listing_title, l.type as listing_type,
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
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Create order
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { listing_id, fruit_offered, fruit_amount } = req.body;
        
        // Get listing
        const listing = await db.query('SELECT * FROM listings WHERE id = $1 AND status = $2', [listing_id, 'active']);
        if (listing.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found or not available' });
        }
        
        const seller_id = listing.rows[0].seller_id;
        
        if (seller_id === req.user.id) {
            return res.status(400).json({ error: 'Cannot buy your own listing' });
        }
        
        const result = await db.query(
            `INSERT INTO orders (listing_id, buyer_id, seller_id, fruit_offered, fruit_amount, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [listing_id, req.user.id, seller_id, fruit_offered, fruit_amount, 'pending']
        );
        
        res.json({ order: result.rows[0] });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Confirm order (seller confirms receiving fruit payment)
router.post('/:id/confirm', authMiddleware, async (req, res) => {
    try {
        const order = await db.query(
            `SELECT o.*, l.account_data, l.type 
             FROM orders o 
             JOIN listings l ON o.listing_id = l.id 
             WHERE o.id = $1`,
            [req.params.id]
        );
        
        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.rows[0].seller_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        // Обновляем статус заказа
        await db.query(
            `UPDATE orders SET status = $1, account_data_revealed = $2, completed_at = CURRENT_TIMESTAMP WHERE id = $3`,
            ['completed', true, req.params.id]
        );
        
        // Обновляем статус объявления
        await db.query('UPDATE listings SET status = $1 WHERE id = $2', ['sold', order.rows[0].listing_id]);
        
        // Отправляем системное сообщение в чат с данными аккаунта
        if (order.rows[0].account_data) {
            await db.query(
                `INSERT INTO chat_messages (order_id, sender_id, message, is_system)
                 VALUES ($1, $2, $3, $4)`,
                [
                    req.params.id,
                    req.user.id,
                    `✅ Продавец подтвердил получение оплаты!\n\n📦 Данные аккаунта:\n${order.rows[0].account_data}`,
                    true
                ]
            );
        }
        
        res.json({ 
            message: 'Order confirmed',
            account_data: order.rows[0].account_data 
        });
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).json({ error: 'Failed to confirm order' });
    }
});

// Get order details with account data (only if payment confirmed)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT o.*, l.title, l.type, l.account_data,
             buyer.username as buyer_name, seller.username as seller_name
             FROM orders o
             JOIN listings l ON o.listing_id = l.id
             JOIN users buyer ON o.buyer_id = buyer.id
             JOIN users seller ON o.seller_id = seller.id
             WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)`,
            [req.params.id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const order = result.rows[0];
        
        // Скрываем данные аккаунта если оплата не подтверждена
        if (!order.account_data_revealed) {
            order.account_data = null;
        }
        
        res.json({ order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

module.exports = router;
