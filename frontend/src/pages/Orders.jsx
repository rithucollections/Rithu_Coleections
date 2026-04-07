import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, Package } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders((data || []).map(o => ({ ...o, products: o.products ? JSON.parse(o.products) : [] })));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    fetchOrders();
  };

  const getBadgeClass = (status) => {
    if (status === 'Pending') return 'badge badge-pending';
    if (status === 'Confirmed') return 'badge badge-confirmed';
    if (status === 'Delivered') return 'badge badge-delivered';
    return 'badge';
  };

  const handleWhatsApp = (order) => {
    const productsList = order.products.map(p => `${p.name} (x${p.quantity || 1})`).join(', ');
    const text = `Order ID: ${order.id}\nProducts: ${productsList}\nTotal: Rs.${order.total_price}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="container animate-fade-in">
      <div className="mb-10"><h1 className="title mb-1">Orders</h1><p className="text-secondary">Track and fulfill customer requests</p></div>
      <div className="flex flex-col gap-6">
        {orders.map(order => (
          <div key={order.id} className="card p-0 overflow-hidden">
            <div className="p-6 flex justify-between items-center bg-white/5 border-b border-white/5">
              <div>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[2px] block mb-1">REFERENCE ID</span>
                <span className="font-black text-lg tracking-wider">#{order.id}</span>
              </div>
              <div className={`${getBadgeClass(order.status)} px-3 py-1.5 rounded-xl border border-current bg-transparent`}>{order.status}</div>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-3 mb-8">
                {order.products.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center"><Package size={20} className="text-gold" /></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase tracking-wide">{p.name}</span>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[1px]">{p.size} | {p.color}</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-white/40">x{p.quantity || 1}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-8 px-2">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[2px]">Total Transaction</span>
                <span className="text-2xl font-black text-gold">Rs.{order.total_price}</span>
              </div>
              <div className="grid-2">
                {order.status === 'Pending' && <button className="btn shadow-xl shadow-gold/10" onClick={() => updateStatus(order.id, 'Confirmed')}><CheckCircle size={18}/> Confirm Order</button>}
                {order.status === 'Confirmed' && <button className="btn shadow-xl shadow-success/10" onClick={() => updateStatus(order.id, 'Delivered')}><Truck size={18}/> Dispatch</button>}
                {order.status === 'Delivered' && <div className="flex items-center gap-2 text-success px-4 bg-success/5 rounded-xl border border-success/10 justify-center"><CheckCircle size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Completed</span></div>}
                <button className="btn btn-secondary" onClick={() => handleWhatsApp(order)}>Notify via WhatsApp</button>
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && <div className="card text-center py-20 border-dashed"><div className="text-white/20 text-sm italic">No orders in the queue...</div></div>}
      </div>
    </div>
  );
};

export default Orders;