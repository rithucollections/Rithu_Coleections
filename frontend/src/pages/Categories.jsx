import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [sizesInput, setSizesInput] = useState('');
  const [sizes, setSizes] = useState([]);
  const [sizeType, setSizeType] = useState('Standard');

  const fetchCat = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('created_at');
    if (error) {
      console.error('Fetch Error:', error);
    }
    setCategories(data || []);
  };

  useEffect(() => { fetchCat(); }, []);

  const openEditor = (cat = null) => {
    if (cat) {
      setEditingId(cat.id);
      setName(cat.name);
      setParentId(cat.parent_id || '');
      setSizes(cat.sizes ? JSON.parse(cat.sizes) : []);
      setSizeType(cat.size_type || 'Standard');
    } else {
      setEditingId(null); setName(''); setParentId('');
      setSizes([]); setSizeType('Standard');
    }
    setSizesInput(''); setView('editor');
  };

  const closeEditor = () => setView('list');

  const handleSizeInputChange = (e) => {
    const val = e.target.value;
    if (sizeType === 'Standard') { if (/^[a-zA-Z]*$/.test(val)) setSizesInput(val.toUpperCase()); }
    else if (sizeType === 'Numeric') { if (/^[0-9]*$/.test(val)) setSizesInput(val); }
    else setSizesInput(val);
  };

  const handleAddChip = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && sizesInput.trim()) {
      if (e.key === 'Enter') e.preventDefault();
      const val = sizesInput.trim().toUpperCase();
      if (!sizes.includes(val)) setSizes([...sizes, val]);
      setSizesInput('');
    }
  };

  const handleRemoveChip = (val) => setSizes(sizes.filter(item => item !== val));

  const handleSave = async () => {
    const trimmedName = name.trim().toUpperCase();
    if (!trimmedName) return;
    const isDuplicate = categories.some(c => c.name.toUpperCase() === trimmedName && c.id !== editingId);
    if (isDuplicate) { alert('This category already exists!'); return; }

    const payload = { name: trimmedName, parent_id: parentId || null, sizes: JSON.stringify(sizes), size_type: sizeType, styles: '[]' };
    
    let response;
    if (editingId) {
      response = await supabase.from('categories').update(payload).eq('id', editingId);
    } else {
      response = await supabase.from('categories').insert(payload);
    }

    if (response.error) {
      console.error('Save Error:', response.error);
      alert('Save failed: ' + response.error.message);
    } else {
      fetchCat(); 
      closeEditor();
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this category?')) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        console.error('Delete Error:', error);
        alert('Delete failed: ' + error.message);
      } else {
        fetchCat();
      }
    }
  };

  const parseSizes = (s) => { try { return JSON.parse(s) || []; } catch { return []; } };

  if (view === 'editor') {
    return (
      <div className="container animate-fade-in pb-40">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
          <button onClick={closeEditor} className="btn btn-secondary" style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="title mb-0">{editingId ? 'Refine' : 'New'} Category</h2>
        </div>
        <div className="flex flex-col gap-8">
          <div className="card">
            <h3 className="subtitle mb-6">Identity</h3>
            <label className="label">Category Name</label>
            <input className="input mb-6" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} placeholder="e.g. SHIRTS" autoFocus />
            <label className="label">Parent Category</label>
            <select className="input" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">None (Root Category)</option>
              {categories.filter(c => c.id !== editingId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="card">
            <h3 className="subtitle mb-6">Sizing Architecture</h3>
            <label className="label">Measurement Type</label>
            <select className="input mb-6" value={sizeType} onChange={(e) => { setSizeType(e.target.value); setSizes([]); setSizesInput(''); }}>
              <option value="Standard">Standard (S, M, L)</option>
              <option value="Numeric">Numeric (38, 40, 42)</option>
              <option value="One Size">One Size</option>
            </select>
            {sizeType !== 'One Size' && (
              <>
                <label className="label">Available Dimensions</label>
                <div className="flex gap-3">
                  <input className="input" style={{flex: 1}} value={sizesInput} onChange={handleSizeInputChange} onKeyDown={handleAddChip} placeholder={sizeType === 'Standard' ? 'Add Size (e.g. XL)' : 'Add Size (e.g. 40)'} />
                  <button className="btn btn-secondary w-auto px-8" onClick={handleAddChip}>Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-6">
                  {sizes.map(s => (
                    <div key={s} className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/20 text-gold text-xs font-black flex items-center gap-2" onClick={() => handleRemoveChip(s)}>
                      {s} <X size={14} className="opacity-50" />
                    </div>
                  ))}
                  {sizes.length === 0 && <span className="text-sm text-white/20 italic">No dimensions defined yet...</span>}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-xl border-top border-white/5 z-[1000]">
          <div className="max-w-[600px] mx-auto">
            <button className="btn shadow-2xl shadow-gold/20 w-full" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Check size={20} /> Save Configuration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div><h1 className="title mb-1">Collections</h1><p className="text-secondary">Category Architecture</p></div>
        <button className="btn w-auto px-6" onClick={() => openEditor()} style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '50px' }}>
          <Plus size={20} /> NEW CATEGORY
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="card group" onClick={() => openEditor({...cat, sizes: parseSizes(cat.sizes)})} style={{cursor: 'pointer', padding: '24px', position: 'relative'}}>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', color: '#fff' }}>{cat.name}</h3>
                  {cat.parent_id && <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '9px', fontWeight: '900', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Sub-Category</span>}
                </div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Dimensions: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{parseSizes(cat.sizes).length > 0 ? parseSizes(cat.sizes).join(', ') : 'Default'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '16px' }}>
                <button onClick={(e) => handleDelete(e, cat.id)} style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,59,59,0.15)', border: '1px solid rgba(255,59,59,0.3)', color: '#ff3b3b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={16}/>
                </button>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
