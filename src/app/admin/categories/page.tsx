'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus, X, Check, Loader2, FolderOpen } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  display_order: number
  product_count: number
}

const EMPTY = { name: '', description: '', display_order: '0' }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/categories')
    if (res.ok) setCategories(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(c: Category) {
    setEditId(c.id)
    setForm({ name: c.name, description: c.description ?? '', display_order: String(c.display_order ?? 0) })
    setError('')
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY)
    setError('')
  }

  async function save() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')

    const url = editId ? `/api/admin/categories/${editId}` : '/api/admin/categories'
    const method = editId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, display_order: parseInt(form.display_order) || 0 }),
    })

    if (res.ok) {
      await load()
      cancelEdit()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to save')
    }
    setSaving(false)
  }

  async function confirmDelete(id: number) {
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) { setDeleteId(null); await load() }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Categories</h1>

      {/* Add / Edit form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-brand-dark mb-4 text-sm uppercase tracking-wide">
          {editId ? 'Edit Category' : 'Add New Category'}
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Category name (e.g. Supplements)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: e.target.value })}
            placeholder="Order"
            title="Display order (lower = first in shop sidebar)"
            className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : editId ? <Check size={15} /> : <Plus size={15} />}
              {editId ? 'Update' : 'Add'}
            </button>
            {editId && (
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 border border-gray-200 text-brand-gray px-3 py-2.5 rounded-xl text-sm hover:border-gray-400 transition-colors"
              >
                <X size={15} /> Cancel
              </button>
            )}
          </div>
        </div>
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
      </div>

      {/* Category list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-brand-gray">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading…
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-brand-gray">
            <FolderOpen size={40} className="mb-2 opacity-30" />
            <p>No categories yet. Add one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-brand-gray">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-brand-gray hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3 font-semibold text-brand-gray hidden md:table-cell">Description</th>
                <th className="text-center px-5 py-3 font-semibold text-brand-gray hidden sm:table-cell">Order</th>
                <th className="text-center px-5 py-3 font-semibold text-brand-gray">Products</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-brand-dark">{c.name}</td>
                  <td className="px-5 py-3 text-brand-gray font-mono text-xs hidden sm:table-cell">{c.slug}</td>
                  <td className="px-5 py-3 text-brand-gray hidden md:table-cell">{c.description ?? '—'}</td>
                  <td className="px-5 py-3 text-center text-brand-gray text-xs hidden sm:table-cell">{c.display_order}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-block bg-primary/10 text-primary font-semibold text-xs px-2.5 py-0.5 rounded-full">
                      {c.product_count}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="p-1.5 text-brand-gray hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      {deleteId === c.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => confirmDelete(c.id)}
                            className="text-xs bg-danger text-white px-2.5 py-1 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="text-xs border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="p-1.5 text-brand-gray hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                          title={c.product_count > 0 ? `${c.product_count} products will be uncategorised` : 'Delete'}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-brand-gray mt-3">
        Deleting a category will not delete its products — they will simply become uncategorised.
      </p>
    </div>
  )
}
