import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingBag, Grid, User, Heart, Menu, Search } from 'lucide-react';
import { CartProvider, useCart } from './context/CartContext';

// Admin Pages
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Orders from './pages/Orders';
import AddProductFlow from './pages/AddProductFlow';
import EditProduct from './pages/EditProduct';
import AdminLogin from './pages/AdminLogin';

// Auth Guard
import ProtectedRoute from './components/ProtectedRoute';

// Storefront Pages
import UserHome from './pages/UserHome';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import Connect from './pages/Connect';

const AdminBottomNav = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';
  return (
    <div className="user-bottom-nav">
      <Link to="/admin" className={`user-nav-item ${isActive('/admin')}`}>
        <Home size={22} />
        <span>Admin</span>
      </Link>
      <Link to="/admin/products" className={`user-nav-item ${isActive('/admin/products')}`}>
        <Package size={22} />
        <span>Prods</span>
      </Link>
      <Link to="/admin/orders" className={`user-nav-item ${isActive('/admin/orders')}`}>
        <ShoppingBag size={22} />
        <span>Orders</span>
      </Link>
      <Link to="/admin/categories" className={`user-nav-item ${isActive('/admin/categories')}`}>
        <Grid size={22} />
        <span>Cats</span>
      </Link>
    </div>
  );
};

const UserBottomNav = () => {
  const location = useLocation();
  const { cart } = useCart();
  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label, cartCount }) => {
    const active = isActive(to);
    const color = active ? 'var(--primary-gold)' : 'rgba(255,255,255,0.4)';

    return (
      <Link to={to} className="user-nav-item" style={{ color: color, textDecoration: 'none', gap: '6px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} strokeWidth={active ? 2 : 1.5} />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: -5, right: -10, 
              background: 'var(--primary-gold)', color: '#000', 
              fontSize: '9px', height: '16px', width: '16px', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontWeight: '900'
            }}>{cartCount}</span>
          )}
        </div>
        <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="user-bottom-nav" style={{ 
      backgroundColor: 'rgba(0,0,0,0.85)', 
      backdropFilter: 'blur(25px)', 
      WebkitBackdropFilter: 'blur(25px)',
      height: '80px',
      borderTop: '1px solid rgba(255,255,255,0.05)'
    }}>
      <NavItem to="/" icon={Search} label="Explore" />
      <NavItem to="/cart" icon={ShoppingBag} label="Bag" cartCount={cart.length} />
      <NavItem to="/profile" icon={User} label="Connect" />
    </div>
  );
};

const App = () => {
  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* USER STOREFRONT ROUTES */}
          <Route path="/" element={<><UserHome /><UserBottomNav /></>} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/profile" element={<><Connect /><UserBottomNav /></>} />
          
          {/* ADMIN AUTH */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ADMIN ROUTES — protected */}
          <Route path="/admin" element={<ProtectedRoute><><Dashboard /><AdminBottomNav /></></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><><Categories /><AdminBottomNav /></></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><><Products /><AdminBottomNav /></></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><><Orders /><AdminBottomNav /></></ProtectedRoute>} />
          <Route path="/admin/add-product" element={<ProtectedRoute><AddProductFlow /></ProtectedRoute>} />
          <Route path="/admin/edit-product/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
        </Routes>
      </Router>
    </CartProvider>
  );
};

export default App;
