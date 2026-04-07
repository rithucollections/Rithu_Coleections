import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X, Upload, Plus, Layers, Zap, AlertTriangle, Link } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AddProductFlow = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1);
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

  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [step5Error, setStep5Error] = useState('');
  const [existingProducts, setExistingProducts] = useState([]);
  const [variantsGenerated, setVariantsGenerated] = useState(isEdit);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('name')
      ]);
      setCategories((cats || []).map(c => ({ ...c, sizes: c.sizes ? JSON.parse(c.sizes) : [] })));
      setExistingProducts(prods || []);

      if (isEdit) {
        const { data: prod } = await supabase.from('products').select('*').eq('id', id).single();
        if (prod) {
          setFormData({
            name: prod.name,
            category_id: String(prod.category_id),
            images: prod.images ? JSON.parse(prod.images) : [],
            selectedSizes: prod.sizes ? JSON.parse(prod.sizes) : [],
            variants: prod.variants ? JSON.parse(prod.variants) : [],
            mrp: String(prod.mrp),
            offer_price: String(prod.offer_price)
          });
          setVariantsGenerated(true);
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit]);

  const activeCategory = categories.find(c => String(c.id) === formData.category_id);

  const isDuplicateName = useMemo(() => {
    if (isEdit) return false;
    return existingProducts.some(p => p.name.toUpperCase() === formData.name.trim().toUpperCase());
  }, [formData.name, existingProducts, isEdit]);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleCategoryChange = (val) => {
    setFormData(prev => ({ ...prev, category_id: val, selectedSizes: [], variants: [] }));
    setVariantsGenerated(false);
  };

  const toggleSelection = (field, value) => {
    setFormData(prev => {
      const list = prev[field];
      const newList = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
      return { ...prev, [field]: newList };
    });
    setVariantsGenerated(false);
  };

  const handleGenerateVariants = () => {
    const newVariants = [];
    formData.selectedSizes.forEach(size => {
      newVariants.push({ size, color: '', stock: '' });
    });
    if (newVariants.length === 0) {
      newVariants.push({ size: 'Standard', color: '', stock: '' });
    }
    setFormData(prev => ({ ...prev, variants: newVariants }));
    setVariantsGenerated(true);
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const v = [...prev.variants];
      v[index][field] = value;
      return { ...prev, variants: v };
    });
  };

  const isStep1Valid = formData.name.trim() && formData.category_id && !isDuplicateName;
  const isStep2Valid = formData.images.length > 0;
  const isStep3Valid = true; // Configuration can be empty
  const isStep4Valid = variantsGenerated && formData.variants.length > 0;

  const handleNext = () => {
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

  const handleSubmit = async () => {
    const totalStock = formData.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
    const upc = isEdit ? undefined : `RC-${Date.now()}`;
    const payload = {
      name: formData.name.toUpperCase(),
      category_id: Number(formData.category_id),
      mrp: Number(formData.mrp),
      offer_price: Number(formData.offer_price) || 0,
      stock: totalStock,
      images: JSON.stringify(formData.images),
      sizes: JSON.stringify(formData.selectedSizes),
      variants: JSON.stringify(formData.variants.map(v => ({ ...v, stock: Number(v.stock) || 0 }))),
      ...(upc ? { upc } : {})
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from('products').update(payload).eq('id', id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    if (!error) {
      alert('Product saved successfully!');
      navigate('/admin/products');
    } else {
      alert('Save failed: ' + error.message);
    }
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
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (!error) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      } else {
        console.error('Upload error:', error);
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
    setFormData(prev => ({ ...prev, images: [...prev.images, urlInput.trim()] }));
    setUrlInput('');
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  if (loading) return <div className="container flex items-center justify-center text-gold">Loading...</div>;

  return (
    <div className="container animate-fade-in pb-32">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <button onClick={() => navigate('/admin/products')} style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="title mb-0">{isEdit ? 'Refine' : 'New'} Masterpiece</h1>
      </div>

      <div style={{ position: 'relative', marginBottom: '48px', width: '100%', paddingLeft: '16px', paddingRight: '16px', boxSizing: 'border-box' }}>
        <div style={{ position: 'absolute', top: '16px', left: '32px', right: '32px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', top: '16px', left: '32px', height: '1px', backgroundColor: 'var(--primary-gold)', zIndex: 0, width: `${((step - 1) / 5) * 85}%`, transition: 'all 0.5s ease' }}></div>
        
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', position: 'relative', zIndex: 10 }}>
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div key={s} style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '10px', transition: 'all 0.5s ease',
              backgroundColor: step >= s ? 'var(--primary-gold)' : '#000',
              color: step >= s ? '#000' : 'rgba(255,255,255,0.4)',
              border: step >= s ? '1px solid var(--primary-gold)' : '1px solid rgba(255,255,255,0.1)',
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
                <input className="input" style={{ borderColor: isDuplicateName ? 'var(--danger)' : 'var(--glass-border)' }} value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. SLIM FIT COTTON SHIRT" />
                {isDuplicateName && <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}><AlertTriangle size={14} /> This name already exists in your registry</div>}
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
            <div style={{ paddingLeft: '16px' }}><h2 className="subtitle mb-1">Visual Gallery</h2><p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '900' }}>2-Column Portrait Grid</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingLeft: '16px', paddingRight: '16px' }}>
              {formData.images.map((img, idx) => (
                <div key={idx} style={{ 
                  position: 'relative', display: 'flex', flexDirection: 'column', aspectRatio: '2/3', 
                  borderRadius: '24px', overflow: 'hidden', 
                  border: idx === 0 ? '1px solid var(--primary-gold)' : '1px solid rgba(255,255,255,0.05)', 
                  boxShadow: idx === 0 ? '0 10px 40px rgba(212,175,55,0.15)' : 'none',
                  backgroundColor: 'rgba(255,255,255,0.02)'
                }}>
                  <img src={img} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {idx === 0 && <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', padding: '6px 0', backgroundColor: 'rgba(212,175,55,0.9)', color: '#000', fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', borderRadius: '8px', textAlign: 'center' }}>Primary Cover</div>}
                  <button style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', cursor: 'pointer' }} onClick={() => removeImage(idx)}><X size={16}/></button>
                </div>
              ))}
              {formData.images.length < 5 && (
                <div style={{ aspectRatio: '2/3', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><Plus size={20} style={{ color: 'var(--primary-gold)' }} /></div>
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
                    return <div key={s} style={{ 
                      padding: '12px 20px', borderRadius: '16px', fontSize: '12px', fontWeight: '900', 
                      textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.3s ease',
                      background: isActive ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#000' : 'rgba(255,255,255,0.4)',
                      border: isActive ? '1px solid var(--primary-gold)' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: isActive ? '0 10px 20px rgba(212,175,55,0.2)' : 'none'
                    }} onClick={() => toggleSelection('selectedSizes', s)}>{s}</div>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="card animate-fade-in" style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="mb-10">
              <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">Stock Setup</h2>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[2px]">
                {formData.variants.length > 0 ? `${formData.variants.length} SKU Variants Active` : 'Initialize your inventory table'}
              </p>
            </div>
            <div className="mb-10 p-5 bg-white/[0.02] rounded-2xl border border-white/5">
              <label className="text-[10px] font-black tracking-[1.5px] text-white/20 uppercase mb-4 block">Current Configuration</label>
              <div className="flex flex-wrap gap-2">
                {formData.selectedSizes.length > 0 ? 
                  formData.selectedSizes.map(s => <span key={s} className="px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest">{s}</span>) 
                  : <span className="text-[10px] text-white/20 italic">No sizes selected...</span>
                }
              </div>
            </div>
            
            {variantsGenerated ? (
              <div className="flex flex-col gap-4">
                {formData.variants.map((v, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/[0.03] p-4 rounded-xl border border-white/5">
                    <span className="text-sm font-bold text-white/80 uppercase tracking-widest">{v.size} Architecture</span>
                    <input className="input" style={{ width: '80px', textAlign: 'center' }} type="number" value={v.stock} onChange={e => handleVariantChange(i, 'stock', e.target.value)} placeholder="0" />
                  </div>
                ))}
                <button className="btn btn-secondary mt-4" onClick={() => setVariantsGenerated(false)}>Reset Table</button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold mb-6 shadow-xl shadow-gold/5"><Layers size={36} /></div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-2">Build Inventory Table</h3>
                <p className="text-white/30 text-[10px] mb-8 max-w-[280px]">Generating unique SKU entries based on your sizing architecture.</p>
                <button className="btn w-auto px-10 shadow-2xl shadow-gold/20" onClick={handleGenerateVariants}><Zap size={18} /> Generate Table</button>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="card animate-fade-in" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', padding: '28px' }}>
            <h2 className="subtitle mb-8">Financials</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <label className="label">Maximum Retail Price (Rs.)</label>
                <input className="input text-lg font-black" type="number" value={formData.mrp} onChange={e => handleChange('mrp', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="label">Luxury Offer Price (Rs.)</label>
                <input className="input text-lg font-black text-gold" type="number" value={formData.offer_price} onChange={e => handleChange('offer_price', e.target.value)} placeholder="0" />
                {step5Error && <div className="text-danger text-[10px] uppercase tracking-widest font-black mt-2">{step5Error}</div>}
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="card animate-fade-in overflow-hidden border-gold/20 bg-white/[0.02]">
            <div className="p-10 text-center bg-gold/5">
              <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold mx-auto mb-6 shadow-2xl shadow-gold/10"><Check size={40} /></div>
              <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Curation Ready</h2>
              <p className="text-white/30 text-xs uppercase tracking-widest">Verify and publish to inventory</p>
            </div>
            <div className="p-8 space-y-4">
              {[
                { l: 'Product', v: formData.name },
                { l: 'Category', v: activeCategory?.name || 'Standard' },
                { l: 'Media', v: `${formData.images.length} Imagery Assets` },
                { l: 'Inventory', v: `${formData.variants.length} SKU Variants` },
                { l: 'Final Offer', v: `Rs.${formData.offer_price || formData.mrp}`, gold: true }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[2px]">{item.l}</span>
                  <span className={`text-sm font-black ${item.gold ? 'text-gold' : 'text-white'}`}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px', paddingBottom: '32px', background: 'linear-gradient(to top, #000 70%, rgba(0,0,0,0.8) 100%)', boxShadow: '0 -20px 40px rgba(0,0,0,0.8)', zIndex: 9999 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '16px' }}>
          {step > 1 && (
            <button style={{ 
              width: '70px', height: '60px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)', 
              color: '#fff', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
            }} onClick={handlePrev}>
              <ArrowLeft size={24}/>
            </button>
          )}
          <button style={{ 
            flex: 1, height: '60px', borderRadius: '18px', background: 'var(--gold-gradient)', color: '#000', 
            border: 'none', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            cursor: (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 4 && !isStep4Valid) ? 'not-allowed' : 'pointer',
            opacity: (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 4 && !isStep4Valid) ? 0.3 : 1,
            boxShadow: '0 15px 35px rgba(212, 175, 55, 0.4)'
          }} onClick={step < 6 ? handleNext : handleSubmit} disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 4 && !isStep4Valid)}>
            {step < 6 ? 'Next Phase' : 'Confirm & Publish'} {step < 6 && <ArrowRight size={22}/>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductFlow;
