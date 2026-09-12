'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Check } from 'lucide-react'

interface Props {
  value: string
  onChange: (val: string) => void
  fieldType: string
  rows?: number
  placeholder?: string
  style?: React.CSSProperties
}

export default function TemplateTextarea({ value, onChange, fieldType, rows = 2, placeholder, style }: Props) {
  const [templates, setTemplates] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/doctor/text-templates?field_type=${encodeURIComponent(fieldType)}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTemplates(d.map((t: { value: string }) => t.value)) })
      .catch(() => {})
  }, [fieldType])

  const trimmed = value.trim()
  const suggestions = trimmed.length > 0
    ? templates.filter(t => t.toLowerCase().includes(trimmed.toLowerCase()) && t !== trimmed)
    : templates

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function saveTemplate() {
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await fetch('/api/doctor/text-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_type: fieldType, value: trimmed }),
      })
      setTemplates(prev => prev.includes(trimmed) ? prev : [trimmed, ...prev])
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch { /* ignore */ }
    setSaving(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <textarea
          value={value}
          onChange={e => { onChange(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          rows={rows}
          placeholder={placeholder}
          style={{ flex: 1, ...style }}
        />
        <button
          type="button"
          onClick={saveTemplate}
          disabled={!trimmed || saving}
          title={saved ? 'Saved!' : 'Save as template'}
          style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E9F0', flexShrink: 0,
            background: saved ? '#ECFDF5' : '#F8FAFC', cursor: trimmed && !saving ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !trimmed || saving ? 0.5 : 1, marginTop: 1, transition: 'background 0.2s'
          }}
        >
          {saved ? <Check size={14} color="#059669" /> : <Plus size={14} color="#6B7280" />}
        </button>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 40, zIndex: 50, marginTop: 3,
          background: '#fff', border: '1px solid #E5E9F0', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 180, overflowY: 'auto'
        }}>
          {suggestions.slice(0, 8).map((s, i) => (
            <div
              key={i}
              onMouseDown={e => { e.preventDefault(); onChange(s); setShowSuggestions(false) }}
              style={{
                padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#374151',
                borderBottom: i < suggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s.length > 100 ? s.slice(0, 100) + '…' : s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
