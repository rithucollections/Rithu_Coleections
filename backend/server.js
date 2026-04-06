const express = require('express');
const cors = require('cors');

const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const path = require('path');
const multer  = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage })

// Routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the path that the frontend can use to render the image
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.use('/category', categoryRoutes);
app.use('/product', productRoutes);
app.use('/order', orderRoutes);

// Dashboard Stats endpoint
app.get('/dashboard', (req, res) => {
  const stats = { totalProducts: 0, totalOrders: 0, revenue: 0, lowStock: 0 };
  
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if(!err && row) stats.totalProducts = row.count;
    
    db.get('SELECT COUNT(*) as count FROM orders', (err, row) => {
      if(!err && row) stats.totalOrders = row.count;
      
      db.get('SELECT SUM(total_price) as sum FROM orders WHERE status != "Cancelled"', (err, row) => {
        if(!err && row && row.sum) stats.revenue = row.sum;
        
        db.get('SELECT COUNT(*) as count FROM products WHERE stock < 5', (err, row) => {
          if(!err && row) stats.lowStock = row.count;
          res.json(stats);
        });
      });
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
