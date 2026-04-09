import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Heart, Star, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

const UserHome = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCat, setSelectedCat] = useState(location.state?.categoryId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cart, wishlist, toggleWishlist, isInWishlist } = useCart();

  useEffect(() => {
    const loadData = async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
      ]);
      setCategories(cats || []);
      setProducts((prods || []).map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        sizes: p.sizes ? JSON.parse(p.sizes) : []
      })));
    };
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.categoryId) {
      setSelectedCat(location.state.categoryId);
    }
  }, [location.state]);

  const fuzzyMatch = (str, query) => {
    if (!query) return true;
    const s = str.toLowerCase();
    const q = query.toLowerCase().trim();
    
    // 1. Partial match (common case)
    if (s.includes(q)) return true;
    
    // 2. Word-based match
    const strWords = s.split(/\s+/);
    const queryWords = q.split(/\s+/);
    
    // If any word in query matches starting of any word in string
    if (queryWords.every(qw => strWords.some(sw => sw.startsWith(qw)))) return true;

    // 3. For spelling mistakes (character sequence with 80% threshold)
    if (q.length < 3) return false;
    
    let matches = 0;
    let j = 0;
    for (let i = 0; i < s.length && j < q.length; i++) {
      if (s[i] === q[j]) {
        matches++;
        j++;
      }
    }
    return matches / q.length >= 0.8;
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = !selectedCat || p.category_id === selectedCat;
    const matchesSearch = fuzzyMatch(p.name, searchQuery);
    return matchesCat && matchesSearch;
  });

  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || 'Product';

  return (
    <div className="user-home pb-32 animate-fade-in" style={{ backgroundColor: '#000', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        backdropFilter: 'blur(20px)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        padding: '16px 24px', 
        height: '72px',
        display: 'flex', 
        alignItems: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {!isSearchOpen ? (
          <>
            <div style={{ flex: 1 }}></div>
            <h1 className="heading-luxury" style={{ 
              fontSize: '18px', 
              letterSpacing: '0.3em', 
              textAlign: 'center', 
              margin: 0, 
              background: 'var(--gold-gradient)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap'
            }}>RITHU COLLECTIONS</h1>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '20px', alignItems: 'center', color: 'rgba(255,255,255,0.8)' }}>
              <div onClick={() => setIsSearchOpen(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Search size={22} strokeWidth={1.5} />
              </div>
              <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/profile')}>
                <Heart size={21} strokeWidth={1.5} fill={wishlist.length > 0 ? "var(--primary-gold)" : "none"} />
                {wishlist.length > 0 && <span className="bag-badge" style={{ background: '#ff3b3b', color: '#fff', top: '-6px', right: '-6px' }}>{wishlist.length}</span>}
              </div>
              <div id="cart-icon-home" style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/cart')}>
                <ShoppingBag size={21} strokeWidth={1.5} />
                {cart.length > 0 && <span className="bag-badge" style={{ top: '-6px', right: '-6px' }}>{cart.length}</span>}
              </div>
            </div>
          </>
        ) : (
          <div className="animate-fade-in" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
              <ArrowLeft size={22} />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                autoFocus
                type="text" 
                placeholder="Search premium collections..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  backgroundColor: 'rgba(255,255,255,0.08)', 
                  border: '1px solid rgba(255,255,255,0.15)', 
                  borderRadius: '16px', 
                  padding: '12px 16px 12px 42px', 
                  fontSize: '14px', 
                  color: '#fff', 
                  outline: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-gold)' }} />
              {searchQuery && (
                <X 
                  size={16} 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} 
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hero Banner */}
      <div style={{ width: '100%', padding: '12px 16px' }}>
        <div style={{ width: '100%', height: '220px', borderRadius: '32px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(45deg, #111, #222)' }}>
          <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
            alt="Featured Collection" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
          />
          <div style={{ position: 'absolute', inset: 0, padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ color: 'var(--primary-gold)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>EXQUISITE WEAR</span>
            <h2 style={{ fontSize: '32px', fontWeight: '800', lineHeight: '1.1', textTransform: 'uppercase', marginBottom: '16px' }}>New<br/>Collection</h2>
            <div style={{ width: 'fit-content', padding: '10px 20px', borderRadius: '14px', backgroundColor: '#fff', color: '#000', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>FLAT 30% OFF</div>
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '12px 16px 20px 16px', gap: '10px', scrollbarWidth: 'none' }}>
        <div 
          onClick={() => setSelectedCat(null)} 
          style={{ padding: '10px 24px', borderRadius: '14px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap', cursor: 'pointer', backgroundColor: !selectedCat ? 'var(--primary-gold)' : 'transparent', color: !selectedCat ? '#000' : 'rgba(255,255,255,0.5)' }}
        >
          ALL
        </div>
        {categories.map(cat => (
          <div 
            key={cat.id} 
            onClick={() => setSelectedCat(cat.id)} 
            style={{ padding: '10px 24px', borderRadius: '14px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap', cursor: 'pointer', backgroundColor: selectedCat === cat.id ? 'var(--primary-gold)' : 'transparent', color: selectedCat === cat.id ? '#000' : 'rgba(255,255,255,0.5)' }}
          >
            {cat.name}
          </div>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid-2" style={{ padding: '0 16px' }}>
        {filteredProducts.map(product => (
          <div key={product.id} className="group" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s' }} onClick={() => navigate(`/product/${product.id}`)}>
            <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: '32px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <img 
                src={product.images?.[0] || 'https://via.placeholder.com/400x600?text=Rithu+Collections'} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s' }} 
                className="group-hover:scale-110" 
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 16px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--primary-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>{getCategoryName(product.category_id)}</span>
                <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Rs.{product.offer_price || product.mrp}</span>
                    {product.offer_price > 0 && product.offer_price < product.mrp && (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>Rs.{product.mrp}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 6px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900' }}>4.2</span>
                    <Star size={10} fill="#D4AF37" color="#D4AF37" />
                  </div>
                </div>
              </div>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  const btn = e.currentTarget;
                  btn.classList.add('heart-pop');
                  toggleWishlist(product);
                  setTimeout(() => btn.classList.remove('heart-pop'), 400);
                }}
                style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isInWishlist(product.id) ? '#ff3b3b' : '#fff', transition: 'all 0.3s' }}
              >
                <Heart size={18} fill={isInWishlist(product.id) ? "#ff3b3b" : "none"} />
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div key="empty" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            No products available in this selection.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHome;
