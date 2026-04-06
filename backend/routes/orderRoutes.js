const express = require('express');
const router = express.Router();
const db = require('../db');

const generateOrderId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// GET /order
router.get('/', (req, res) => {
    db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(r => {
            if (r.products) r.products = JSON.parse(r.products);
        });
        res.json(rows);
    });
});

// POST /order
router.post('/', (req, res) => {
    const { products, total_price } = req.body;
    if (!products || total_price === undefined) return res.status(400).json({ error: 'Missing required fields' });
    
    const id = generateOrderId();
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run('INSERT INTO orders (id, products, total_price, status) VALUES (?, ?, ?, ?)', 
            [id, JSON.stringify(products), total_price, 'Pending'], function(err) {
            
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }
            
            // Reduce stock
            for (let prod of products) {
                const qty = prod.quantity || 1;
                db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, prod.id]);
            }
            
            db.run('COMMIT');
            res.status(201).json({ id, status: 'Pending' });
        });
    });
});

// PUT /order/:id/status
router.put('/:id/status', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Status updated' });
    });
});

module.exports = router;
