import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Star, Check, ShoppingBag, Plus, Minus, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [{ data: prod }, { data: cats }] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('categories').select('*'),
      ]);
      if (prod) {
        const parsed = { ...prod, images: prod.images ? JSON.parse(prod.images) : [], sizes: prod.sizes ? JSON.parse(prod.sizes) : [], variants: prod.variants ? JSON.parse(prod.variants) : [] };
        setProduct(parsed);
        if (parsed.sizes?.length > 0) setSelectedSize(parsed.sizes[0]);
      }
      setCategories(cats || []);
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) { setError('Please select a size'); return; }
    addToCart(product, { size: selectedSize }, 1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  if (loading) return <div className="detail-layout flex items-center justify-center text-gold">Loading...</div>;
  if (!product) return <div className="detail-layout flex items-center justify-center text-danger">Product not found</div>;

  const getCategoryName = (cid) => categories.find(c => c.id === cid)?.name || 'Product';

  return (
    <div className="detail-layout" style={{ backgroundColor: '#000', minHeight: '100vh', paddingBottom: '120px' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '24px', display: 'flex', justifyContent: 'space-between', zIndex: 1000, pointerEvents: 'none' }}>
        <button style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', gap: '12px', pointerEvents: 'auto' }}>
          <button style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Heart size={20} /></button>
          <button style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate('/cart')}><ShoppingBag size={20} /></button>
        </div>
      </div>
      <div style={{ width: '100%', height: '75vh', position: 'relative', overflow: 'hidden' }}>
        <img src={product.images?.[activeImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="animate-fade-in" />
        <div style={{ position: 'absolute', bottom: '80px', left: '24px' }}>
          <div style={{ padding: '6px 12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#000' }}>4.2</span>
            <Star size={10} fill="#000" />
            <div style={{ width: '1px', height: '10px', backgroundColor: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(0,0,0,0.4)' }}>12.5k reviews</span>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {product.images?.map((_, idx) => (
            <div key={idx} onClick={() => setActiveImg(idx)} style={{ width: activeImg === idx ? '24px' : '6px', height: '6px', borderRadius: '3px', backgroundColor: activeImg === idx ? 'var(--primary-gold)' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s', cursor: 'pointer' }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', padding: '12px 24px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {product.images?.map((img, idx) => (
          <div key={idx} onClick={() => setActiveImg(idx)} style={{ flexShrink: 0, width: '60px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: activeImg === idx ? '2px solid var(--primary-gold)' : '2px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }}>
            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
      <div className="animate-slide-up" style={{ marginTop: '-16px', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', backgroundColor: '#111', padding: '32px 24px 40px 24px', position: 'relative', zIndex: 10, boxShadow: '0 -20px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary-gold)', textTransform: 'uppercase', letterSpacing: '2.5px', display: 'block', marginBottom: '8px' }}>{getCategoryName(product.category_id)}</span>
            <h1 style={{ fontSize: '26px', fontWeight: '800', lineHeight: '1.1', textTransform: 'uppercase', marginBottom: '0' }}>{product.name}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>Rs.{product.offer_price || product.mrp}</span>
              {product.offer_price > 0 && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>Rs.{product.mrp}</span>}
            </div>
            {product.offer_price > 0 && <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(212,175,55,0.1)', color: 'var(--primary-gold)', display: 'inline-block' }}>{Math.round((product.mrp - product.offer_price) / product.mrp * 100)}% OFF</div>}
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '32px' }} />
        {product.sizes?.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Select Size</label>
              <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary-gold)', letterSpacing: '1px' }}>SIZE GUIDE</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {product.sizes.map(s => (
                <div key={s} onClick={() => { setSelectedSize(s); setError(''); }} style={{ padding: '12px 20px', borderRadius: '14px', fontSize: '12px', fontWeight: '900', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: selectedSize === s ? 'var(--primary-gold)' : 'rgba(255,255,255,0.02)', color: selectedSize === s ? '#000' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.3s' }}>{s}</div>
              ))}
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: '700', marginTop: '12px' }}>{error}</p>}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '20px' }}><Check size={18} style={{ color: 'var(--primary-gold)' }} /><span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>Premium Authenticity Guaranteed</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '20px' }}><Star size={18} style={{ color: 'var(--primary-gold)' }} /><span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>Artisanal Quality & Craftsmanship</span></div>
        </div>
      </div>
      <div className="sticky-footer-v2">
        <button onClick={handleAddToCart} disabled={!selectedSize && product.sizes?.length > 0} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: 'var(--gold-gradient)', color: '#000', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', boxShadow: '0 10px 40px rgba(212, 175, 55, 0.4)', transition: 'all 0.3s', opacity: (!selectedSize && product.sizes?.length > 0) ? 0.6 : 1 }}>
          {(!selectedSize && product.sizes?.length > 0) ? 'Choose Size to Add' : 'Add to Bag'}
        </button>
      </div>
      {showToast && (
        <div style={{ position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000 }}>
          <div style={{ backgroundColor: '#fff', color: '#000', padding: '12px 32px', borderRadius: '30px', fontWeight: '900', fontSize: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>ITEM ADDED TO BAG</div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
