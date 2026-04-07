import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts((data || []).map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      sizes: p.sizes ? JSON.parse(p.sizes) : [],
      variants: p.variants ? JSON.parse(p.variants) : []
    })));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) fetchProducts();
      else alert('Delete failed: ' + error.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.upc || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
           <h1 className="title mb-1">Inventory</h1>
           <p className="text-secondary text-xs uppercase tracking-widest">Manage your luxury collection</p>
        </div>
        <button className="btn w-auto px-6 shadow-xl shadow-gold/10" onClick={() => navigate('/admin/add-product')} style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '50px' }}>
          <Plus size={20} /> NEW PRODUCT
        </button>
      </div>

      <div className="relative mb-10">
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', color: 'rgba(255,255,255,0.3)' }}>
          <Search size={18} />
        </div>
        <input 
           className="input" 
           style={{ paddingLeft: '48px' }} 
           placeholder="Search inventory by name or SKU..." 
           value={search} 
           onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <div className="grid-2">
        {filteredProducts.map(prod => (
          <div key={prod.id} className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
            <div style={{ position: 'relative', aspectRatio: '2/3', width: 'calc(100% - 16px)', margin: '8px', borderRadius: '24px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <img src={prod.images?.[0]} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
                <button 
                  style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/edit-product/${prod.id}`)}
                >
                  <Edit2 size={16}/>
                </button>
                <button 
                  style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,59,59,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,59,59,0.3)', color: '#ff3b3b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={() => handleDelete(prod.id)}
                >
                  <Trash2 size={16}/>
                </button>
              </div>

              <div style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '4px 8px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {prod.upc || 'NO SKU'}
                </span>
              </div>
            </div>

            <div style={{ padding: '4px 16px 16px 16px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {prod.name}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--primary-gold)' }}>Rs.{prod.offer_price || prod.mrp}</span>
                  {prod.offer_price > 0 && prod.offer_price < prod.mrp && (
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>Rs.{prod.mrp}</span>
                  )}
                </div>
                <div style={{ padding: '4px 8px', borderRadius: '8px', backgroundColor: prod.stock < 5 ? 'rgba(255,59,59,0.1)' : 'rgba(255,255,255,0.05)', color: prod.stock < 5 ? 'var(--danger)' : 'rgba(255,255,255,0.4)' }}>
                  <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock: {prod.stock}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontStyle: 'italic' }}>Nothing found in your vault...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
