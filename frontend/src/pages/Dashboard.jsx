import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, AlertCircle, Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, revenue: 0, lowStock: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/dashboard`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-end mb-10">
        <div>
           <h1 className="title mb-1">Storefront</h1>
           <p className="text-secondary">Administrative Overview</p>
        </div>
        <div className="text-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div className="text-[10px] font-black text-gold uppercase tracking-[2px]">Welcome back</div>
            <div className="text-sm font-bold">Manager</div>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/admin/login'); }}
            title="Logout"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '8px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,80,80,0.12)'; e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      
      <div className="grid-2 mb-10">
        <div className="card flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center mb-4">
             <Package className="text-gold" size={24} />
          </div>
          <h2 className="text-2xl font-black mb-1">{stats.totalProducts}</h2>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Inventory</span>
        </div>
        
        <div className="card flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center mb-4">
             <ShoppingBag className="text-gold" size={24} />
          </div>
          <h2 className="text-2xl font-black mb-1">{stats.totalOrders}</h2>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Orders</span>
        </div>

        <div className="card flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center mb-4">
             <DollarSign className="text-gold" size={24} />
          </div>
          <h2 className="text-2xl font-black mb-1">₹{stats.revenue}</h2>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Revenue</span>
        </div>

        <div className="card flex flex-col items-center justify-center text-center" style={{borderColor: stats.lowStock > 0 ? 'rgba(255, 59, 59, 0.3)' : ''}}>
          <div className={`w-12 h-12 ${stats.lowStock > 0 ? 'bg-danger/10' : 'bg-gold/10'} rounded-2xl flex items-center justify-center mb-4`}>
             <AlertCircle className={stats.lowStock > 0 ? 'text-danger' : 'text-gold'} size={24} />
          </div>
          <h2 className={`text-2xl font-black mb-1 ${stats.lowStock > 0 ? 'text-danger' : ''}`}>{stats.lowStock}</h2>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Refill Needed</span>
        </div>
      </div>

      <h2 className="subtitle mb-6">Management</h2>
      <div className="flex flex-col gap-4">
        <button className="btn shadow-xl shadow-gold/10" onClick={() => navigate('/admin/add-product')}>
          <Plus size={20} /> New Masterpiece
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/orders')}>
          Review Orders
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
