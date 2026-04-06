const express = require('express');
const router = express.Router();
const db = require('../db');

// UPC Generator Helper
const generateUPC = () => {
    return new Promise((resolve, reject) => {
        db.get('SELECT id FROM products ORDER BY id DESC LIMIT 1', [], (err, row) => {
            if (err) return reject(err);
            let nextId = 1;
            if (row) nextId = row.id + 1;
            const upc = `DRS-${nextId.toString().padStart(4, '0')}`;
            resolve(upc);
        });
    });
};

// GET /product
router.get('/', (req, res) => {
    db.all('SELECT * FROM products ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(r => {
            if (r.images) try { r.images = JSON.parse(r.images); } catch(e){}
            if (r.sizes) try { r.sizes = JSON.parse(r.sizes); } catch(e){}
            if (r.colors) try { r.colors = JSON.parse(r.colors); } catch(e){}
            if (r.variants) try { r.variants = JSON.parse(r.variants); } catch(e){}
        });
        res.json(rows);
    });
});

// GET /product/:id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        
        if (row.images) try { row.images = JSON.parse(row.images); } catch(e){}
        if (row.sizes) try { row.sizes = JSON.parse(row.sizes); } catch(e){}
        if (row.colors) try { row.colors = JSON.parse(row.colors); } catch(e){}
        if (row.variants) try { row.variants = JSON.parse(row.variants); } catch(e){}
        
        res.json(row);
    });
});

// POST /product
router.post('/', async (req, res) => {
    const { name, category_id, images, sizes, colors, mrp, offer_price, stock, variants } = req.body;
    if (!name || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const upc = await generateUPC();
        
        db.run(`INSERT INTO products (name, category_id, images, sizes, colors, mrp, offer_price, stock, upc, variants) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [name, category_id, JSON.stringify(images||[]), JSON.stringify(sizes||[]), JSON.stringify(colors||[]), mrp || 0, offer_price || 0, stock || 0, upc, JSON.stringify(variants||[])], 
                function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, upc });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /product/:id
router.put('/:id', (req, res) => {
    const { name, category_id, images, sizes, colors, mrp, offer_price, stock, variants } = req.body;
    const { id } = req.params;
    
    db.run(`UPDATE products SET name = ?, category_id = ?, images = ?, sizes = ?, colors = ?, mrp = ?, offer_price = ?, stock = ?, variants = ? WHERE id = ?`, 
            [name, category_id, JSON.stringify(images||[]), JSON.stringify(sizes||[]), JSON.stringify(colors||[]), mrp, offer_price, stock, JSON.stringify(variants||[]), id], 
            function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated successfully' });
    });
});

// DELETE /product/:id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM products WHERE id = ?', id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted successfully' });
    });
});

module.exports = router;
