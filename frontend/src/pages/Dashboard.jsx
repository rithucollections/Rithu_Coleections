import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, AlertCircle, Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, revenue: 0, lowStock: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      const [{ count: totalProducts }, { count: totalOrders }, { data: orders }, { count: lowStock }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_price').neq('status', 'Cancelled'),
        supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 5),
      ]);
      const revenue = orders ? orders.reduce((sum, o) => sum + (o.total_price || 0), 0) : 0;
      setStats({ totalProducts: totalProducts || 0, totalOrders: totalOrders || 0, revenue, lowStock: lowStock || 0 });
    };
    loadStats();
  }, []);

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-end mb-10">
        <div><h1 className="title mb-1">Storefront</h1><p className="text-secondary">Administrative Overview</p></div>
        <div className="text-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div className="text-[10px] font-black text-gold uppercase tracking-[2px]">Welcome back</div>
            <div className="text-sm font-bold">Manager</div>
          </div>
          <button onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/admin/login'); }} title="Logout"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,80,80,0.12)'; e.currentTarget.style.color = '#ff6b6b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
      <div className="grid-2 mb-10">
        <div className="card flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center mb-4"><Package className="text-gold" size={24} /></div>
          <h2 className="text-2xl font-black mb-1">{stats.totalProducts}</h2>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Inventory</span>
        </div>
        <div className="card flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center mb-4"><ShoppingBag className="text-gold" size={24} /></div>
          <h2 className="text-2xl font-black mb-1">{stats.totalOrders}</h2>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Orders</span>
        </div>
        <div className="card flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center mb-4"><DollarSign className="text-gold" size={24} /></div>
          <h2 className="text-2xl font-black mb-1">Rs.{stats.revenue}</h2>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Revenue</span>
        </div>
        <div className="card flex flex-col items-center justify-center text-center" style={{borderColor: stats.lowStock > 0 ? 'rgba(255, 59, 59, 0.3)' : ''}}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stats.lowStock > 0 ? 'bg-danger/10' : 'bg-gold/10'}`}>
            <AlertCircle className={stats.lowStock > 0 ? 'text-danger' : 'text-gold'} size={24} />
          </div>
          <h2 className={`text-2xl font-black mb-1 ${stats.lowStock > 0 ? 'text-danger' : 'text-white'}`}>{stats.lowStock}</h2>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Refill Needed</span>
        </div>
      </div>
      <h2 className="subtitle mb-6">Management</h2>
      <div className="flex flex-col gap-4">
        <button className="btn shadow-xl shadow-gold/10" onClick={() => navigate('/admin/add-product')}><Plus size={20} /> New Masterpiece</button>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/orders')}>Review Orders</button>
      </div>
    </div>
  );
};

export default Dashboard;
