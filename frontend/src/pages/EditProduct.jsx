import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Check, Trash2, Plus, Upload, Link, AlertTriangle, Zap, RefreshCw, Layers, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    images: [],
    selectedSizes: [],
    variants: [],
    mrp: '',
    offer_price: ''
  });

  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [globalStock, setGlobalStock] = useState('');
  
  // Track if configuration changed to warn about variants
  const [configChanged, setConfigChanged] = useState(false);
  const [initialConfig, setInitialConfig] = useState({ sizes: [], colors: [] });


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: cats }, { data: prod }] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('products').select('*').eq('id', id).single()
        ]);
        const parsedCats = (cats || []).map(c => ({ ...c, sizes: c.sizes ? JSON.parse(c.sizes) : [] }));
        setCategories(parsedCats);
        if (prod) {
          const parsedImages = prod.images ? JSON.parse(prod.images) : [];
          const parsedSizes = prod.sizes ? JSON.parse(prod.sizes) : [];
          const parsedVariants = prod.variants ? JSON.parse(prod.variants) : [];
          setFormData({ name: prod.name, category_id: String(prod.category_id), images: parsedImages, selectedSizes: parsedSizes, variants: parsedVariants, mrp: prod.mrp, offer_price: prod.offer_price });
          setInitialConfig({ sizes: parsedSizes });
          const cat = parsedCats.find(c => c.id === Number(prod.category_id));
          setActiveCategory(cat || null);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCategoryChange = (val) => {
    const cat = categories.find(c => c.id === Number(val));
    setActiveCategory(cat || null);
    setFormData(prev => ({ ...prev, category_id: val }));
  };

  const toggleSelection = (field, value) => {
    setFormData(prev => {
      const list = prev[field];
      const newList = list.includes(value) 
        ? list.filter(item => item !== value) 
        : [...list, value];
      
      const isDifferent = JSON.stringify(newList.sort()) !== JSON.stringify(initialConfig.sizes.sort());
      setConfigChanged(isDifferent);
      
      return { ...prev, [field]: newList };
    });
  };

  const handleGenerateVariants = () => {
    if (window.confirm('This will reset all existing stocks. Continue?')) {
      const newVariants = [];
      const sizesToUse = formData.selectedSizes.length > 0 ? formData.selectedSizes : ['Standard'];

      sizesToUse.forEach(size => {
        newVariants.push({ size, color: '', stock: '' });
      });
      setFormData(prev => ({ ...prev, variants: newVariants }));
      setConfigChanged(false);
      setInitialConfig({
        sizes: formData.selectedSizes
      });
    }
  };

  const handleVariantStockChange = (index, val) => {
    setFormData(prev => {
      const v = [...prev.variants];
      v[index].stock = val;
      return { ...prev, variants: v };
    });
  };

  const applyGlobalStock = () => {
    if (!globalStock) return;
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => ({ ...v, stock: globalStock }))
    }));
  };

  const groupedVariants = useMemo(() => {
    const groups = {};
    formData.variants.forEach((v, index) => {
      if (!groups[v.size]) groups[v.size] = [];
      groups[v.size].push({ ...v, originalIndex: index });
    });
    return groups;
  }, [formData.variants]);

  const handleSubmit = async () => {
    const totalStock = formData.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
    const { error } = await supabase.from('products').update({
      name: formData.name,
      category_id: Number(formData.category_id),
      mrp: Number(formData.mrp),
      offer_price: Number(formData.offer_price) || 0,
      stock: totalStock,
      images: JSON.stringify(formData.images),
      sizes: JSON.stringify(formData.selectedSizes),
      variants: JSON.stringify(formData.variants.map(v => ({ ...v, stock: Number(v.stock) || 0 })))
    }).eq('id', id);
    if (!error) { alert('Product successfully updated!'); navigate('/admin/products'); }
    else { alert('Update failed: ' + error.message); }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) return alert('Max 5 images');
    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (!error) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        setFormData(prev => ({ ...prev, images: [...prev.images, urlData.publicUrl] }));
      }
    }
  };

  if (loading) return (
    <div className="container flex items-center justify-center" style={{minHeight: '80vh'}}>
      <RefreshCw className="animate-spin text-gold" size={40} />
    </div>
  );

  return (
    <div className="container" style={{paddingBottom: '100px'}}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate('/admin/products')} 
          style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="title" style={{marginBottom: '4px'}}>Edit Product</h1>
          <span className="text-secondary text-xs uppercase tracking-widest">ID: #{id}</span>
        </div>
      </div>

      <div className="card">
        {/* SECTION 1: BASIC */}
        <section>
          <h2 className="subtitle flex items-center gap-2">
            <Layers size={18} className="text-gold" /> Basic Information
          </h2>
          <label className="label">Product Name</label>
          <input 
            className="input" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          
          <label className="label mt-4">Category</label>
          <select className="input" value={formData.category_id} onChange={e => handleCategoryChange(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </section>

        <div className="section-divider" />

        {/* SECTION 2: IMAGES */}
        <section>
          <h2 className="subtitle flex items-center gap-2">
            <Upload size={18} className="text-gold" /> Media Gallery
          </h2>
          <div className="grid-2" style={{ marginTop: '20px' }}>
            {formData.images.map((img, idx) => (
              <div key={idx} style={{ 
                position: 'relative', 
                aspectRatio: '2/3', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                border: `1px solid ${idx === 0 ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)'}`,
                backgroundColor: 'rgba(255,255,255,0.02)'
              }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {idx === 0 && (
                   <div style={{ 
                      position: 'absolute', bottom: '10px', left: '10px', right: '10px', padding: '6px', 
                      backgroundColor: 'rgba(212,175,55,0.9)', color: '#000', fontSize: '8px', 
                      fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', 
                      borderRadius: '8px', textAlign: 'center'
                   }}>
                      Primary Cover
                   </div>
                )}
                
                <button 
                  style={{ 
                    position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', 
                    borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', 
                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
                  }} 
                  onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})}
                >
                  <X size={16}/>
                </button>
              </div>
            ))}
            
            {formData.images.length < 5 && (
              <div 
                style={{ 
                  aspectRatio: '2/3', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)', 
                  backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }} 
                onClick={() => fileInputRef.current.click()}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                   <Plus size={20} style={{ color: 'var(--primary-gold)' }} />
                </div>
                <span style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Add View</span>
              </div>
            )}
          </div>
          <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileUpload} />
        </section>

        <div className="section-divider" />

        {/* SECTION 3: CONFIG */}
        <section>
          <h2 className="subtitle flex items-center gap-2">
            <Zap size={18} className="text-gold" /> Configuration
          </h2>
          {activeCategory?.sizes?.length > 0 && (
            <div className="mb-6">
              <label className="label">Sizes</label>
              <div className="flex flex-wrap gap-2">
                {activeCategory.sizes.map(s => {
                  const isActive = formData.selectedSizes.includes(s);
                  return (
                    <span 
                      key={s} 
                      className={`chip ${isActive ? 'active' : ''}`}
                      onClick={() => toggleSelection('selectedSizes', s)}
                    >{s}</span>
                  );
                })}
              </div>
            </div>
          )}


          {configChanged && (
            <div className="mt-6 p-4 rounded-xl border border-gold/20 bg-gold/5 flex flex-col items-center text-center animate-fadeIn">
              <AlertTriangle className="text-gold mb-2" size={24} />
              <p className="text-sm mb-4">Configuration changed. You must regenerate variants to apply these changes.</p>
              <button className="btn btn-secondary w-auto" onClick={handleGenerateVariants}>
                <RefreshCw size={16} /> Regenerate Variants
              </button>
            </div>
          )}
        </section>

        <div className="section-divider" />

        {/* SECTION 4: VARIANTS */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="subtitle flex items-center gap-2" style={{marginBottom: 0}}>
              <Check size={18} className="text-gold" /> Inventory & Stock
            </h2>
            <span className="text-secondary text-xs">{formData.variants.length} Variants</span>
          </div>

          <div className="quick-fill-bar">
            <Zap size={18} className="text-gold" />
            <input 
              type="number" 
              className="input" 
              placeholder="Set stock for all..."
              value={globalStock}
              onChange={e => setGlobalStock(e.target.value)}
            />
            <button className="btn" style={{width: 'auto', padding: '10px 20px'}} onClick={applyGlobalStock}>Apply</button>
          </div>

          <div className="flex flex-col gap-6">
            {Object.keys(groupedVariants).map(size => (
              <div key={size} className="variant-group">
                <div className="variant-group-header">SIZE: {size}</div>
                {groupedVariants[size].map((v) => (
                  <div key={v.originalIndex} className="variant-row">
                    <div className="variant-info">
                      <span style={{fontSize: '0.9rem'}}>{size} Architecture</span>
                    </div>
                    <input 
                      className="input" 
                      type="number" 
                      style={{width: '80px', textAlign: 'center'}}
                      value={formData.variants[v.originalIndex].stock} 
                      onChange={e => handleVariantStockChange(v.originalIndex, e.target.value)} 
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider" />

        {/* SECTION 5: PRICING */}
        <section>
          <h2 className="subtitle flex items-center gap-2">
            <Zap size={18} className="text-gold" /> Pricing
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">MRP (₹)</label>
              <input className="input" type="number" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} />
            </div>
            <div>
              <label className="label">Offer Price (₹)</label>
              <input className="input" type="number" value={formData.offer_price} onChange={e => setFormData({...formData, offer_price: e.target.value})} />
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Footer */}
      <div className="sticky-footer">
        <button className="btn btn-secondary" style={{width: 'auto'}} onClick={() => navigate('/admin/products')}>Cancel</button>
        <button className="btn" onClick={handleSubmit}>Update Product</button>
      </div>
    </div>
  );
};

export default EditProduct;
