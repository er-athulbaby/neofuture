'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import { formatPrice } from '@/lib/utils'
import { Plus, Edit2, Trash2, Eye, Star, Search, X, Package, Upload, ImagePlus, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { ProductRow } from './page'

interface Category { id: number; name: string }
interface Props { products: ProductRow[]; categories: Category[] }
interface Variant { id: number; label: string; price: number | null; sale_price: number | null; stock: number; sku: string | null }
const EMPTY_VARIANT = { label: '', price: '', sale_price: '', stock: '0', sku: '' }

const EMPTY_FORM = {
  name: '', category_id: '', price: '', sale_price: '', stock: '', sku: '',
  short_description: '', description: '', ingredients: '', how_to_use: '',
  flavor: '', weight: '', images: '', is_active: true, is_featured: false,
}

export default function AdminProductsClient({ products: initial, categories }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductRow[]>(initial)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT)
  const [addingVariant, setAddingVariant] = useState(false)
  const [showVariants, setShowVariants] = useState(false)

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category_name?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (!editId) { setVariants([]); setShowVariants(false); return }
    fetch(`/api/admin/products/${editId}/variants`)
      .then((r) => r.json())
      .then((d) => setVariants(d.variants ?? []))
      .catch(() => {})
  }, [editId])

  async function addVariant() {
    if (!editId || !variantForm.label) return
    setAddingVariant(true)
    const res = await fetch(`/api/admin/products/${editId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: variantForm.label,
        price: variantForm.price || null,
        sale_price: variantForm.sale_price || null,
        stock: variantForm.stock,
        sku: variantForm.sku || null,
      }),
    })
    setAddingVariant(false)
    if (res.ok) {
      const data = await res.json()
      setVariants((v) => [...v, data.variant])
      setVariantForm(EMPTY_VARIANT)
      toast('Variant added!')
    } else {
      toast('Failed to add variant', 'error')
    }
  }

  async function deleteVariant(variantId: number) {
    if (!editId) return
    await fetch(`/api/admin/products/${editId}/variants`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant_id: variantId }),
    })
    setVariants((v) => v.filter((x) => x.id !== variantId))
    toast('Variant removed')
  }

  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(p: ProductRow) {
    setEditId(p.id)
    setForm({
      name: p.name,
      category_id: p.category_id ? String(p.category_id) : '',
      price: String(p.price),
      sale_price: p.sale_price ? String(p.sale_price) : '',
      stock: String(p.stock),
      sku: p.sku ?? '',
      short_description: p.short_description ?? '',
      description: p.description ?? '',
      ingredients: p.ingredients ?? '',
      how_to_use: p.how_to_use ?? '',
      flavor: p.flavor ?? '',
      weight: p.weight ?? '',
      images: p.images?.join(', ') ?? '',
      is_active: p.is_active,
      is_featured: p.is_featured,
    })
    setShowForm(true)
  }

  async function uploadImages(files: FileList) {
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        urls.push(data.url)
      } else {
        toast(`Failed to upload ${file.name}`, 'error')
      }
    }
    setUploading(false)
    if (urls.length) {
      setForm((f) => ({
        ...f,
        images: f.images ? f.images + ', ' + urls.join(', ') : urls.join(', '),
      }))
      toast(`${urls.length} image(s) uploaded`)
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) { toast('Name and price are required', 'error'); return }
    setSaving(true)

    const payload = {
      name: form.name,
      category_id: form.category_id ? Number(form.category_id) : null,
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      stock: Number(form.stock) || 0,
      sku: form.sku || null,
      short_description: form.short_description || null,
      description: form.description || null,
      ingredients: form.ingredients || null,
      how_to_use: form.how_to_use || null,
      flavor: form.flavor || null,
      weight: form.weight || null,
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
      is_active: form.is_active,
      is_featured: form.is_featured,
    }

    const url = editId ? `/api/admin/products/${editId}` : '/api/admin/products'
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) { toast('Failed to save product', 'error'); return }
    toast(editId ? 'Product updated!' : 'Product created!')
    setShowForm(false)
    router.refresh()
  }

  async function toggleActive(id: number, current: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...products.find((p) => p.id === id),
        is_active: !current,
        images: products.find((p) => p.id === id)?.images ?? [],
      }),
    })
    if (res.ok) {
      setProducts((pp) => pp.map((p) => p.id === id ? { ...p, is_active: !current } : p))
      toast(!current ? 'Product activated' : 'Product deactivated')
    }
  }

  async function deleteProduct(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts((pp) => pp.filter((p) => p.id !== id))
      toast('Product deleted')
    }
  }

  const fc = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const t = e.target as HTMLInputElement
    setForm((f) => ({ ...f, [t.name]: t.type === 'checkbox' ? t.checked : t.value }))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-brand-gray hover:text-primary text-sm">Admin</Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-bold text-brand-dark text-xl flex items-center gap-2">
            <Package size={20} className="text-primary" /> Products
          </h1>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-brand-gray">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-brand-gray hidden md:table-cell">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-gray">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-gray hidden sm:table-cell">Stock</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-gray">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-gray">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-brand-gray">No products found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                          <Package size={14} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-brand-dark">{p.name}</p>
                        {p.is_featured && <span className="text-xs text-neo-orange flex items-center gap-0.5"><Star size={10} fill="currentColor" /> Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-brand-gray hidden md:table-cell">{p.category_name ?? '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <p className="font-semibold text-brand-dark">{formatPrice(p.sale_price ?? p.price)}</p>
                    {p.sale_price && <p className="text-xs text-brand-gray line-through">{formatPrice(p.price)}</p>}
                  </td>
                  <td className="py-3 px-4 text-right hidden sm:table-cell">
                    <span className={cn('font-semibold', p.stock <= 5 ? 'text-danger' : p.stock <= 20 ? 'text-neo-orange' : 'text-success')}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => toggleActive(p.id, p.is_active)}
                      className={cn('text-xs px-2.5 py-1 rounded-full font-semibold transition-colors', p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/products/${p.slug}`} target="_blank"
                        className="p-1.5 text-brand-gray hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 text-brand-gray hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => deleteProduct(p.id, p.name)}
                        className="p-1.5 text-brand-gray hover:text-danger rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-brand-dark text-lg">{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="sm:col-span-2">
                  <FLabel label="Product Name *" />
                  <input name="name" value={form.name} onChange={fc} required className={fClass} placeholder="e.g. Menstrual Cup" />
                </div>

                <div>
                  <FLabel label="Category" />
                  <select name="category_id" value={form.category_id} onChange={fc} className={fClass}>
                    <option value="">— Select category —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <FLabel label="SKU" />
                  <input name="sku" value={form.sku} onChange={fc} className={fClass} placeholder="Optional" />
                </div>

                <div>
                  <FLabel label="Price (₹) *" />
                  <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={fc} required className={fClass} />
                </div>

                <div>
                  <FLabel label="Sale Price (₹)" />
                  <input name="sale_price" type="number" step="0.01" min="0" value={form.sale_price} onChange={fc} className={fClass} />
                </div>

                <div>
                  <FLabel label="Stock" />
                  <input name="stock" type="number" min="0" value={form.stock} onChange={fc} className={fClass} />
                </div>

                <div>
                  <FLabel label="Flavor / Variant" />
                  <input name="flavor" value={form.flavor} onChange={fc} className={fClass} placeholder="e.g. XS / Purple" />
                </div>

                <div className="sm:col-span-2">
                  <FLabel label="Short Description" />
                  <input name="short_description" value={form.short_description} onChange={fc} className={fClass} placeholder="One-line summary" />
                </div>

                <div className="sm:col-span-2">
                  <FLabel label="Full Description" />
                  <textarea name="description" value={form.description} onChange={fc} rows={4} className={fClass + ' resize-none'} />
                </div>

                <div className="sm:col-span-2">
                  <FLabel label="Ingredients / Materials" />
                  <textarea name="ingredients" value={form.ingredients} onChange={fc} rows={2} className={fClass + ' resize-none'} />
                </div>

                <div className="sm:col-span-2">
                  <FLabel label="How to Use" />
                  <textarea name="how_to_use" value={form.how_to_use} onChange={fc} rows={2} className={fClass + ' resize-none'} />
                </div>

                {/* Image upload */}
                <div className="sm:col-span-2">
                  <FLabel label="Product Images" />
                  <div className="flex gap-2 mb-2">
                    <input
                      name="images"
                      value={form.images}
                      onChange={fc}
                      className={fClass}
                      placeholder="URLs comma-separated, or upload below"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-brand-dark rounded-xl text-sm font-medium transition-colors flex-shrink-0 disabled:opacity-50"
                    >
                      {uploading ? <Upload size={15} className="animate-bounce" /> : <ImagePlus size={15} />}
                      {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.length) uploadImages(e.target.files) }}
                    />
                  </div>
                  {/* Image previews */}
                  {form.images && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.images.split(',').map((url) => url.trim()).filter(Boolean).map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200 bg-gray-50" />
                          <button
                            type="button"
                            onClick={() => {
                              const urls = form.images.split(',').map((u) => u.trim()).filter(Boolean)
                              urls.splice(i, 1)
                              setForm((f) => ({ ...f, images: urls.join(', ') }))
                            }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" name="is_active" id="is_active" checked={form.is_active} onChange={fc} className="w-4 h-4 accent-primary" />
                  <label htmlFor="is_active" className="text-sm font-medium text-brand-dark">Active (visible in shop)</label>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" name="is_featured" id="is_featured" checked={form.is_featured} onChange={fc} className="w-4 h-4 accent-primary" />
                  <label htmlFor="is_featured" className="text-sm font-medium text-brand-dark">Featured (shown on homepage)</label>
                </div>

              </div>

              {/* Variants section (edit mode only) */}
              {editId && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowVariants((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-brand-dark"
                  >
                    <span className="flex items-center gap-2">
                      <Layers size={15} className="text-primary" />
                      Variants ({variants.length})
                    </span>
                    <span className="text-brand-gray text-xs">{showVariants ? '▲ hide' : '▼ show'}</span>
                  </button>

                  {showVariants && (
                    <div className="p-4 space-y-3">
                      {variants.length > 0 && (
                        <table className="w-full text-xs border-collapse mb-2">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left py-1.5 text-brand-gray font-semibold">Label</th>
                              <th className="text-right py-1.5 text-brand-gray font-semibold">Price</th>
                              <th className="text-right py-1.5 text-brand-gray font-semibold">Stock</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map((v) => (
                              <tr key={v.id} className="border-b border-gray-50">
                                <td className="py-1.5 font-medium text-brand-dark">{v.label}</td>
                                <td className="py-1.5 text-right text-brand-gray">
                                  {v.price ? `₹${v.price}` : '(base)'}
                                  {v.sale_price ? ` / ₹${v.sale_price} sale` : ''}
                                </td>
                                <td className="py-1.5 text-right text-brand-gray">{v.stock}</td>
                                <td className="py-1.5 text-right">
                                  <button type="button" onClick={() => deleteVariant(v.id)}
                                    className="p-1 text-gray-400 hover:text-danger transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide">Add Variant</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <input
                            value={variantForm.label}
                            onChange={(e) => setVariantForm((f) => ({ ...f, label: e.target.value }))}
                            placeholder="Label (e.g. XS - Purple) *"
                            className={fClass}
                          />
                        </div>
                        <input
                          value={variantForm.price}
                          onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))}
                          placeholder="Price ₹ (blank=base)"
                          type="number" min="0" step="0.01"
                          className={fClass}
                        />
                        <input
                          value={variantForm.sale_price}
                          onChange={(e) => setVariantForm((f) => ({ ...f, sale_price: e.target.value }))}
                          placeholder="Sale price ₹ (opt)"
                          type="number" min="0" step="0.01"
                          className={fClass}
                        />
                        <input
                          value={variantForm.stock}
                          onChange={(e) => setVariantForm((f) => ({ ...f, stock: e.target.value }))}
                          placeholder="Stock"
                          type="number" min="0"
                          className={fClass}
                        />
                        <input
                          value={variantForm.sku}
                          onChange={(e) => setVariantForm((f) => ({ ...f, sku: e.target.value }))}
                          placeholder="SKU (optional)"
                          className={fClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addVariant}
                        disabled={addingVariant || !variantForm.label}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-50 transition-colors"
                      >
                        <Plus size={13} /> {addingVariant ? 'Adding...' : 'Add Variant'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-brand-gray hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors">
                  {saving ? 'Saving...' : editId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const fClass = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary'
function FLabel({ label }: { label: string }) {
  return <label className="block text-xs font-semibold text-brand-gray mb-1">{label}</label>
}
