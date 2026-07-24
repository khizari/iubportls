'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const emptyProduct = {
  name: '',
  slug: '',
  category: '',
  price: '',
  salePrice: '',
  stock: '',
  description: '',
  sizes: '',
  colors: '',
  featured: false,
  images: [],
};

export default function ProductForm({ initialProduct = null }) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);

  const [form, setForm] = useState(() =>
    initialProduct
      ? {
          ...emptyProduct,
          ...initialProduct,
          price: initialProduct.price ?? '',
          salePrice: initialProduct.salePrice ?? '',
          stock: initialProduct.stock ?? '',
          sizes: (initialProduct.sizes || []).join(', '),
          colors: (initialProduct.colors || []).join(', '),
        }
      : emptyProduct
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        uploaded.push(data.url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeImage(url) {
    setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }));
    // best-effort delete from blob storage; ignore failures
    fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }).catch(() => {});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch(isEdit ? `/api/products/${initialProduct.id}` : '/api/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${initialProduct.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${initialProduct.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="field">
        <label>Product name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label>Slug (URL) — leave blank to auto-generate</label>
        <input type="text" value={form.slug} onChange={(e) => update('slug', e.target.value)} />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Category</label>
          <input type="text" value={form.category} onChange={(e) => update('category', e.target.value)} />
        </div>
        <div className="field">
          <label>Stock quantity</label>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => update('stock', e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Sale price ($) — optional</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.salePrice}
            onChange={(e) => update('salePrice', e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Sizes (comma-separated)</label>
          <input
            type="text"
            placeholder="S, M, L, XL"
            value={form.sizes}
            onChange={(e) => update('sizes', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Colors (comma-separated)</label>
          <input
            type="text"
            placeholder="Black, White, Beige"
            value={form.colors}
            onChange={(e) => update('colors', e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Description</label>
        <textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
      </div>

      <div className="field checkbox-field">
        <input
          type="checkbox"
          id="featured"
          checked={form.featured}
          onChange={(e) => update('featured', e.target.checked)}
        />
        <label htmlFor="featured" style={{ margin: 0 }}>
          Feature on homepage
        </label>
      </div>

      <div className="field">
        <label>Images</label>
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
        {uploading && <p style={{ fontSize: 13, color: '#6b7280' }}>Uploading…</p>}
        {form.images.length > 0 && (
          <div className="image-grid">
            {form.images.map((url) => (
              <div className="image-item" key={url}>
                <img src={url} alt="" />
                <button type="button" className="remove-btn" onClick={() => removeImage(url)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
        </button>
        {isEdit && (
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete product'}
          </button>
        )}
      </div>
    </form>
  );
}
