import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Plus, X, Upload, Link, Layers, RefreshCw, Zap } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';

const AddProductFlow = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [step, setStep] = useState(1);
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
  const [step5Error, setStep5Error] = useState('');
  const [urlInput, setUrlInput] = useState('');
  
  // New states for Step 4
  const [allProducts, setAllProducts] = useState([]);
  const [variantsGenerated, setVariantsGenerated] = useState(false);
  const [globalStock, setGlobalStock] = useState('');


  useEffect(() => {
    // Fetch all categories
    fetch(`${API_URL}/category`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));

    // Fetch all products for duplicate checking
    fetch(`${API_URL}/product`)
      .then(res => res.json())
      .then(data => setAllProducts(data))
      .catch(err => console.error(err));

    if (isEdit) {
       fetch(`${API_URL}/product/${id}`)
        .then(res => res.json())
        .then(prod => {
          setFormData({
            name: prod.name,
            category_id: String(prod.category_id),
            images: prod.images || [],
            selectedSizes: prod.sizes || [],
            variants: prod.variants || [],
            mrp: prod.mrp,
            offer_price: prod.offer_price
          });
          if (prod.variants && prod.variants.length > 0) {
            setVariantsGenerated(true);
          }
        });
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (formData.category_id) {
      const cat = categories.find(c => c.id === Number(formData.category_id));
      setActiveCategory(cat || null);
    }
  }, [formData.category_id, categories]);

  // Handle category change manually to avoid reset on mount
  const handleCategoryChange = (val) => {
    setFormData(prev => ({ ...prev, category_id: val }));
    const cat = categories.find(c => c.id === Number(val));
    setActiveCategory(cat || null);
    
    // Only reset if it's a real change (not initial load)
    setFormData(prev => ({
      ...prev,
      selectedSizes: [],
      variants: []
    }));
    setVariantsGenerated(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSelection = (field, value) => {
    setFormData(prev => {
      const list = prev[field];
      if (list.includes(value)) {
        return { ...prev, [field]: list.filter(item => item !== value) };
      }
      return { ...prev, [field]: [...list, value] };
    });
    // Reset generation if selection changes
    setVariantsGenerated(false);
  };

  const handleGenerateVariants = () => {
    const newVariants = [];
    const sizesToUse = formData.selectedSizes.length > 0 ? formData.selectedSizes : ['Standard'];

    sizesToUse.forEach(size => {
      newVariants.push({ size, color: '', stock: '' });
    });
    setFormData(prev => ({ ...prev, variants: newVariants }));
    setVariantsGenerated(true);
  };

  const applyGlobalStock = () => {
    if (!globalStock) return;
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => ({ ...v, stock: globalStock }))
    }));
  };

  const handleVariantStockChange = (index, val) => {
    setFormData(prev => {
      const v = [...prev.variants];
      v[index].stock = val;
      return { ...prev, variants: v };
    });
  };

  const isDuplicateName = useMemo(() => {
    if (!formData.name.trim()) return false;
    return allProducts.some(p => 
      p.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && 
      (!isEdit || p.id !== Number(id))
    );
  }, [formData.name, allProducts, isEdit, id]);

  // Grouped variants for rendering
  const groupedVariants = useMemo(() => {
    const groups = {};
    formData.variants.forEach((v, index) => {
      if (!groups[v.size]) groups[v.size] = [];
      groups[v.size].push({ ...v, originalIndex: index });
    });
    return groups;
  }, [formData.variants]);

  // Validation Logic
  const isStep1Valid = formData.name.trim() !== '' && formData.category_id !== '' && !isDuplicateName;
  const isStep2Valid = formData.images.length >= 1;
  const isStep3Valid = formData.selectedSizes.length > 0;
  const isStep4Valid = variantsGenerated && formData.variants.some(v => Number(v.stock) > 0);

  const handleNext = () => {
    if (step === 2 && !isStep2Valid) return;
    if (step === 3 && !isStep3Valid) return;
    if (step === 4 && !isStep4Valid) return;
    
    if (step === 5) {
      const mrp = Number(formData.mrp);
      const offer = Number(formData.offer_price);
      if (offer > 0 && offer >= mrp) {
        setStep5Error('Offer price must be less than MRP.');
        return;
      }
      setStep5Error('');
    }
    setStep(s => Math.min(s + 1, 6));
  };
  
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = () => {
    const totalStock = formData.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
    const url = isEdit ? `${API_URL}/product/${id}` : `${API_URL}/product`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        category_id: Number(formData.category_id),
        mrp: Number(formData.mrp),
        offer_price: Number(formData.offer_price) || 0,
        stock: totalStock,
        images: formData.images,
        sizes: formData.selectedSizes,
        variants: formData.variants.map(v => ({...v, stock: Number(v.stock) || 0}))
      })
    }).then(res => {
      if (res.ok) {
        alert('Masterpiece successfully synchronized with inventory.');
        navigate('/admin/products');
      } else {
        alert('Synchronization failed. Please check your connection and try again.');
      }
    }).catch(err => {
      console.error(err);
      alert('A critical error occurred while publishing. Please try again.');
    });
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    if (formData.images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const uploadedUrls = [];
    for (const file of files) {
      const data = new FormData();
      data.append('image', file);
      try {
        const resp = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: data
        });
        const result = await resp.json();
        if (result.url) {
          uploadedUrls.push(`${API_URL}${result.url}`);
        }
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 5)
      }));
    }
  };

  const addUrlImage = () => {
    if (!urlInput.trim()) return;
    if (formData.images.length >= 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, urlInput.trim()]
    }));
    setUrlInput('');
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="container animate-fade-in pb-32">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate('/admin/products')} 
          style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="title mb-0">{isEdit ? 'Refine' : 'New'} Masterpiece</h1>
      </div>
      
      {/* Premium Progress Stepper - INLINE FORCED HORIZONTAL */}
      <div style={{ position: 'relative', marginBottom: '48px', width: '100%', paddingLeft: '16px', paddingRight: '16px', boxSizing: 'border-box' }}>
         {/* Background Line */}
         <div style={{ position: 'absolute', top: '16px', left: '32px', right: '32px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
         {/* Active Progress Line */}
         <div style={{ 
            position: 'absolute', top: '16px', left: '32px', height: '1px', backgroundColor: 'var(--primary-gold)', zIndex: 0,
            width: `${((step - 1) / 5) * 85}%`, transition: 'all 0.5s ease'
         }}></div>
         
         <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', position: 'relative', zIndex: 10 }}>
            {[1,2,3,4,5,6].map(s => (
              <div key={s} style={{ 
                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontSize: '10px', transition: 'all 0.5s ease',
                backgroundColor: step >= s ? 'var(--primary-gold)' : '#000',
                color: step >= s ? '#000' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${step >= s ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: step === s ? '0 0 20px rgba(212,175,55,0.3)' : 'none'
              }}>
                {step > s ? <Check size={14} /> : s}
              </div>
            ))}
         </div>
      </div>

      <div style={{ width: '100%' }}>
        {step === 1 && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '28px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '28px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Product Architecture</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label className="label">Item Designation</label>
                <input 
                  className="input" 
                  style={{ borderColor: isDuplicateName ? 'var(--danger)' : 'var(--glass-border)' }}
                  value={formData.name} 
                  onChange={e => handleChange('name', e.target.value)} 
                  placeholder="e.g. SLIM FIT COTTON SHIRT" 
                />
                {isDuplicateName && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <AlertTriangle size={14} /> This name already exists in your registry
                  </div>
                )}
              </div>
              
              <div>
                <label className="label">Collection Segment</label>
                <select className="input" value={formData.category_id} onChange={e => handleCategoryChange(e.target.value)}>
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ paddingLeft: '16px' }}>
              <h2 className="subtitle mb-1">Visual Gallery</h2>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900' }}>2-Column Portrait Grid</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingLeft: '16px', paddingRight: '16px' }}>
              {formData.images.map((img, idx) => (
                <div key={idx} style={{ 
                  position: 'relative', display: 'flex', flexDirection: 'column', aspectRatio: '2/3', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.5s ease', backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: idx === 0 ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)',
                  boxShadow: idx === 0 ? '0 10px 40px rgba(212,175,55,0.15)' : 'none'
                }}>
                  <img src={img} alt={`Product ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {idx === 0 && (
                     <div style={{ 
                        position: 'absolute', bottom: '12px', left: '12px', right: '12px', padding: '6px 0', backgroundColor: 'rgba(212,175,55,0.9)', 
                        color: '#000', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', borderRadius: '8px', textAlign: 'center'
                     }}>
                        Primary Cover
                     </div>
                  )}
                  
                  <button 
                    style={{ 
                      position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', 
                      backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(10px)', cursor: 'pointer'
                    }} 
                    onClick={() => removeImage(idx)}
                  >
                    <X size={16}/>
                  </button>
                </div>
              ))}
              
              {formData.images.length < 6 && (
                <div 
                  style={{ 
                    aspectRatio: '2/3', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }} 
                  onClick={() => fileInputRef.current.click()}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <Plus size={20} style={{ color: 'var(--primary-gold)' }} />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Add View</span>
                </div>
              )}
            </div>

            <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

            <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
              <div style={{ padding: '24px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <label className="label" style={{ display: 'block', marginBottom: '16px' }}>Direct Image URL</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input className="input" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." />
                    <button className="btn btn-secondary" style={{ width: '60px' }} onClick={addUrlImage}><Link size={20} /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card animate-fade-in" style={{ padding: '28px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="subtitle mb-2">Configuration</h2>
            <p className="text-white/30 text-xs mb-8">Set available dimensions for <strong>{activeCategory?.name}</strong>.</p>
            
            {activeCategory?.sizes?.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <label className="label">Available Sizes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                  {activeCategory.sizes.map(s => {
                    const isActive = formData.selectedSizes.includes(s);
                    return (
                      <div 
                        key={s} 
                        style={{ 
                          padding: '12px 20px', borderRadius: '16px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: isActive ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#000' : 'rgba(255,255,255,0.4)',
                          border: `1px solid ${isActive ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: isActive ? '0 10px 20px rgba(212,175,55,0.2)' : 'none'
                        }}
                        onClick={() => toggleSelection('selectedSizes', s)}
                      >{s}</div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="card animate-fade-in" style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Header & Subtitle */}
            <div className="mb-10">
              <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">Stock Setup</h2>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[2px]">
                {formData.variants.length > 0 ? `${formData.variants.length} SKU Variants Active` : 'Initialize your inventory table'}
              </p>
            </div>

            {/* Summary Section (Read Only) */}
            <div className="mb-10 p-5 bg-white/[0.02] rounded-2xl border border-white/5">
              <label className="text-[10px] font-black tracking-[1.5px] text-white/20 uppercase mb-4 block">Current Configuration</label>
              <div className="flex flex-wrap gap-2">
                {formData.selectedSizes.length > 0 ? formData.selectedSizes.map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest">{s}</span>
                )) : <span className="text-[10px] text-white/20 italic">No sizes selected...</span>}
              </div>
            </div>
            
            {!variantsGenerated ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold mb-6 shadow-xl shadow-gold/5">
                  <Layers size={36} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-2">Build Inventory Table</h3>
                <p className="text-white/30 text-[10px] mb-8 max-w-[280px]">Generating unique SKU entries based on your sizing architecture.</p>
                
                <button className="btn w-auto px-10 shadow-2xl shadow-gold/20" onClick={handleGenerateVariants}>
                  <Zap size={18} /> Generate Table
                </button>
              </div>
            ) : (
              <div>
                {/* Bulk Action - CLEAN UI */}
                <div className="mb-10 p-6 bg-gold/[0.03] border border-gold/10 rounded-2xl flex flex-col gap-4">
                  <label className="text-[10px] font-black text-gold/60 tracking-[1.5px] uppercase">Smart Update (Batch)</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input 
                      type="number" 
                      className="input" 
                      style={{ height: '48px', fontSize: '14px', flex: 1, backgroundColor: 'rgba(255,255,255,0.02)' }} 
                      placeholder="Set stock for all..."
                      value={globalStock}
                      onChange={(e) => setGlobalStock(e.target.value)}
                    />
                    <button className="btn w-auto px-6 h-[48px] text-[10px] rounded-xl" onClick={applyGlobalStock}>Apply to All</button>
                  </div>
                </div>

                {/* Stock Table - MINIMAL & GROUPED */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(groupedVariants).map(size => (
                    <div key={size} className="space-y-4 mb-8">
                       <label className="text-[10px] font-black text-white/20 uppercase tracking-[2.5px] pl-2">{size} Architecture</label>
                       {groupedVariants[size].map((v) => (
                        <div key={v.originalIndex} 
                             style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.03)', 
                                borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.3s'
                             }}
                             className="hover:border-gold/20 group"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black uppercase tracking-wider text-white/80 group-hover:text-gold transition-colors">{size}</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                             <input 
                                className="input w-24 h-10 py-0 text-center text-xs font-black rounded-xl border-white/5 focus:border-gold/40 focus:bg-gold/[0.02]" 
                                type="number" 
                                value={formData.variants[v.originalIndex].stock} 
                                onChange={e => handleVariantStockChange(v.originalIndex, e.target.value)} 
                                placeholder="0" 
                              />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-center">
                   <button className="text-[10px] font-black text-white/20 uppercase tracking-[2px] transition-all hover:text-gold" onClick={() => setVariantsGenerated(false)}>
                      Regenerate Table Architecture
                   </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="card animate-fade-in">
            <h2 className="subtitle mb-8">Commercials</h2>
            <div className="space-y-6">
              <div>
                <label className="label">Retail Price (MRP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-black">₹</span>
                  <input className="input pl-10" type="number" value={formData.mrp} onChange={e => handleChange('mrp', e.target.value)} placeholder="0.00" />
                </div>
              </div>
              
              <div>
                <label className="label">Boutique Offer Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-black">₹</span>
                  <input className="input pl-10 border-gold/30" type="number" value={formData.offer_price} onChange={e => handleChange('offer_price', e.target.value)} placeholder="0.00" />
                </div>
              </div>

              {step5Error && (
                 <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-[10px] font-black tracking-wider leading-relaxed uppercase">
                    <AlertTriangle size={16} /> {step5Error}
                 </div>
              )}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="card animate-fade-in overflow-hidden p-0">
            <div className="p-10 text-center bg-gold/5">
              <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold mx-auto mb-6 shadow-2xl shadow-gold/10">
                <Check size={40} />
              </div>
              <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Curation Ready</h2>
              <p className="text-white/30 text-xs uppercase tracking-widest">Verify and publish to shopify</p>
            </div>
            
            <div className="p-8 space-y-4">
              {[
                { l: 'Product', v: formData.name },
                { l: 'Category', v: activeCategory?.name },
                { l: 'Media', v: `${formData.images.length} Imagery Assets` },
                { l: 'Inventory', v: `${formData.variants.length} SKU Variants` },
                { l: 'Final Offer', v: `₹${formData.offer_price || formData.mrp}`, gold: true }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[2px]">{item.l}</span>
                  <span className={`text-sm font-black ${item.gold ? 'text-gold text-lg' : 'text-white'}`}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Controls - PREMIUM BUTTONS - HIGH VISIBILITY */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px', paddingBottom: '32px', background: 'linear-gradient(to top, #000 70%, rgba(0,0,0,0.8) 100%)', boxShadow: '0 -20px 40px rgba(0,0,0,0.8)', zIndex: 9999 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '16px' }}>
          {step > 1 && (
            <button 
              style={{ width: '70px', height: '60px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }} 
              onClick={handlePrev}
            >
               <ArrowLeft size={24}/>
            </button>
          )}
          
          <button 
            style={{ 
              flex: 1, height: '60px', borderRadius: '18px', background: 'var(--gold-gradient)', color: '#000', border: 'none', 
              fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              cursor: (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 3 && !isStep3Valid) || (step === 4 && !isStep4Valid) ? 'not-allowed' : 'pointer',
              opacity: (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 3 && !isStep3Valid) || (step === 4 && !isStep4Valid) ? 0.3 : 1,
              boxShadow: '0 15px 35px rgba(212, 175, 55, 0.4)', transition: 'all 0.3s'
            }} 
            onClick={step < 6 ? handleNext : handleSubmit}
            disabled={
              (step === 1 && !isStep1Valid) || 
              (step === 2 && !isStep2Valid) || 
              (step === 3 && !isStep3Valid) ||
              (step === 4 && !isStep4Valid)
            } 
          >
             {step < 6 ? 'Next Phase' : 'Confirm & Publish'} {step < 6 && <ArrowRight size={22}/>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductFlow;
