const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /category
router.get('/', (req, res) => {
    db.all('SELECT * FROM categories', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(r => {
            if (r.sizes) try { r.sizes = JSON.parse(r.sizes); } catch(e){}
            if (r.styles) try { r.styles = JSON.parse(r.styles); } catch(e){}
            r.colors_enabled = !!r.colors_enabled;
        });
        res.json(rows);
    });
});

// POST /category
router.post('/', (req, res) => {
    const { name, parent_id, sizes, size_type, styles, colors_enabled } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    db.run(
        'INSERT INTO categories (name, parent_id, sizes, size_type, styles, colors_enabled) VALUES (?, ?, ?, ?, ?, ?)', 
        [name, parent_id || null, JSON.stringify(sizes || []), size_type || '', JSON.stringify(styles || []), colors_enabled ? 1 : 0], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, name, parent_id });
        }
    );
});

// PUT /category/:id
router.put('/:id', (req, res) => {
    const { name, parent_id, sizes, size_type, styles, colors_enabled } = req.body;
    const { id } = req.params;
    
    db.run(
        'UPDATE categories SET name = ?, parent_id = ?, sizes = ?, size_type = ?, styles = ?, colors_enabled = ? WHERE id = ?', 
        [name, parent_id || null, JSON.stringify(sizes || []), size_type || '', JSON.stringify(styles || []), colors_enabled ? 1 : 0, id], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Updated successfully' });
        }
    );
});

// DELETE /category/:id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM categories WHERE id = ?', id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted successfully' });
    });
});

module.exports = router;
