const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'shop.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Add new columns to categories if they don't exist
      db.run(`ALTER TABLE categories ADD COLUMN sizes TEXT`, (err) => {});
      db.run(`ALTER TABLE categories ADD COLUMN size_type TEXT`, (err) => {});
      db.run(`ALTER TABLE categories ADD COLUMN styles TEXT`, (err) => {});
      db.run(`ALTER TABLE categories ADD COLUMN colors_enabled INTEGER DEFAULT 0`, (err) => {});

      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER,
        images TEXT,
        sizes TEXT,
        colors TEXT,
        mrp REAL NOT NULL,
        offer_price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        upc TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Add new columns to products
      db.run(`ALTER TABLE products ADD COLUMN variants TEXT`, (err) => {});

      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        products TEXT,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    });
  }
});

module.exports = db;
