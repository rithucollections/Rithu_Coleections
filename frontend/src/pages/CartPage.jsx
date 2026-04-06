import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, CheckCircle, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

import { WHATSAPP_NUMBER } from '../config';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, subtotal, totalMRP, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    
    try {
      // 1. Save order to backend
      const res = await fetch(`${API_URL}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: cart.map(item => ({
            id: item.id,
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.offer_price || item.mrp
          })),
          total_price: subtotal
        })
      });

      const data = await res.json();
      if (res.ok) {
        setOrderId(data.id);
        
        // 2. Format WhatsApp Message (As Requested)
        let message = `Order ID: ${data.id}\n\nProducts:\n`;
        cart.forEach(item => {
          message += `${item.name} (${item.size || 'N/A'}, ${item.color || 'N/A'}) x${item.quantity}\n`;
        });
        message += `\nTotal: ₹${subtotal}`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

        // 3. Trigger redirect and clear cart locally
        setTimeout(() => {
          window.location.href = whatsappUrl;
          clearCart();
          setOrderSuccess(true);
          setLoading(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
        <div className="container flex flex-col items-center justify-center p-10 text-center bg-black animate-fade-in" style={{minHeight: '80vh'}}>
            <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mb-8">
               <CheckCircle size={40} className="text-gold" />
            </div>
            <h2 className="heading-luxury text-3xl text-gradient-gold mb-2">Order Authenticated</h2>
            <p className="text-secondary text-sm mb-10 max-w-[240px] leading-relaxed">
               Your fashion selection is being processed. 
               Order ID: <span className="text-white font-bold">#{orderId}</span>
            </p>
            <button className="btn-premium px-12" onClick={() => navigate('/')}>Continue Exploring</button>
        </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center p-10 text-center bg-black" style={{minHeight: '80vh'}}>
        <div className="mb-8 opacity-20">
           <ShoppingBag size={100} strokeWidth={1} />
        </div>
        <h2 className="heading-luxury text-2xl text-white mb-4">Your Bag is Empty</h2>
        <p className="text-secondary text-sm mb-10 max-w-[200px] leading-relaxed">Discover our latest collections and find your perfect fit.</p>
        <button className="btn-premium px-12" onClick={() => navigate('/')}>Explore Collections</button>
      </div>
    );
  }

  return (
    <div className="cart-page bg-black pb-32 min-h-screen animate-fade-in" style={{ paddingBottom: '120px' }}>
      {/* Premium Header */}
      <div className="flex items-center justify-between px-6 py-5 sticky top-0 bg-black/80 backdrop-blur-xl z-[100]" style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
        <div className="flex items-center gap-5">
          <ArrowLeft size={22} onClick={() => navigate(-1)} strokeWidth={1.5} />
          <h1 className="text-sm font-black tracking-[3px] uppercase">My Bag</h1>
        </div>
        <span className="text-[10px] font-black text-gold tracking-widest">{cart.length} ITEMS</span>
      </div>

      <div className="px-5 pt-8">
        {/* Cart items V2 */}
        <div className="mb-10">
          {cart.map(item => (
            <div key={item.cartId} className="cart-v2-item animate-fade-in" style={{ padding: '16px', position: 'relative', marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '20px' }}>
              
              {/* Product Image */}
              <div style={{ position: 'relative', width: '90px', height: '120px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={item.images?.[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Item Details */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2px 0' }}>
                <div>
                   <h3 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fff', marginBottom: '8px' }}>
                     {item.name}
                   </h3>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ padding: '4px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                          Size: <span style={{ color: '#fff' }}>{item.size || 'N/A'}</span>
                        </span>
                      </div>
                   </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                  {/* Premium Quantity Selector */}
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: 'rgba(255,255,255,0.08)', 
                    borderRadius: '50px', padding: '8px 18px', border: '1px solid rgba(255,255,255,0.05)' 
                  }}>
                      <button onClick={() => updateQuantity(item.cartId, -1)} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <Minus size={16} />
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#fff', width: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-gold)', cursor: 'pointer' }}>
                        <Plus size={16} />
                      </button>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '15px', fontWeight: '900', color: '#fff' }}>₹{(item.offer_price || item.mrp) * item.quantity}</div>
                     {item.offer_price < item.mrp && (
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>₹{item.mrp * item.quantity}</div>
                     )}
                  </div>
                </div>
              </div>

              {/* Floating Delete Button */}
              <button 
                onClick={() => removeFromCart(item.cartId)} 
                style={{ 
                  position: 'absolute', top: '-10px', right: '-10px', width: '36px', height: '36px', 
                  borderRadius: '50%', backgroundColor: 'rgba(255,59,59,0.2)', backdropFilter: 'blur(10px)', 
                  border: '1px solid rgba(255,59,59,0.3)', color: '#ff3b3b', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(255,59,59,0.2)'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Price summary V2 */}
        <div className="cart-summary-v2 mb-10">
          <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[2px] mb-6">Order Summary</h4>
          <div className="summary-line">
            <span className="text-white/50 font-medium">Bag Total</span>
            <span className="text-white font-bold">₹{totalMRP}</span>
          </div>
          <div className="summary-line">
            <span className="text-white/50 font-medium">Bag Discount</span>
            <span className="text-gold font-bold">-₹{totalMRP - subtotal}</span>
          </div>
          <div className="summary-line">
            <span className="text-white/50 font-medium">Delivery</span>
            <span className="text-success font-bold">Complimentary</span>
          </div>
          <div className="summary-total-v2">
            <span className="text-xs font-black uppercase tracking-widest text-white/30">Grand Total</span>
            <span className="text-2xl font-black text-gradient-gold">₹{subtotal}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button V2 */}
      <div className="sticky-footer-v2">
        <button 
          className="btn-premium w-full shadow-2xl shadow-gold/20 flex items-center justify-center gap-3" 
          onClick={handleCheckout} 
          disabled={loading}
        >
          {loading ? (
             <>
                <RefreshCw size={20} className="animate-spin" /> SECURING ORDER...
             </>
          ) : (
             <>CONTINUE TO WHATSAPP</>
          )}
        </button>
      </div>
    </div>
  );
};

export default CartPage;
