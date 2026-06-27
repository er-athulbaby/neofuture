'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { Settings, Upload, Eye, EyeOff, Save } from 'lucide-react'
import Image from 'next/image'

interface SiteSettings {
  site_name: string
  tagline: string
  logo_url: string
  favicon_url: string
  contact_email: string
  contact_phone: string
  whatsapp_number: string
  address: string
  instagram_url: string
  facebook_url: string
  razorpay_mode: string
}

const DEFAULTS: SiteSettings = {
  site_name: 'NeoFuture',
  tagline: 'From trusted hands to quality lives',
  logo_url: '',
  favicon_url: '',
  contact_email: '',
  contact_phone: '',
  whatsapp_number: '',
  address: '',
  instagram_url: '',
  facebook_url: '',
  razorpay_mode: 'test',
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => { if (d.settings) setSettings({ ...DEFAULTS, ...d.settings }) })
      .finally(() => setLoading(false))
  }, [])

  const fc = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setSettings((s) => ({ ...s, [e.target.name]: e.target.value }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    if (res.ok) toast('Settings saved!')
    else toast('Failed to save', 'error')
  }

  if (loading) return <div className="p-8 text-brand-gray">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2">
        <Settings size={20} className="text-primary" /> Site Settings
      </h1>

      <form onSubmit={save} className="space-y-6">

        {/* Branding */}
        <Section title="Branding & Logo">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Site Name" name="site_name" value={settings.site_name} onChange={fc} />
            <Field label="Tagline" name="tagline" value={settings.tagline} onChange={fc} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Logo URL</label>
            <div className="flex gap-3 items-start">
              <input name="logo_url" value={settings.logo_url} onChange={fc}
                placeholder="https://your-cdn.com/logo.png"
                className={inputClass} />
              {settings.logo_url && (
                <div className="w-16 h-16 border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                  <img src={settings.logo_url} alt="Logo preview" className="max-w-full max-h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
            </div>
            <p className="text-xs text-brand-gray mt-1">Upload your logo image to any image host (e.g. imgbb.com, Cloudinary) and paste the URL here.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Favicon URL</label>
            <input name="favicon_url" value={settings.favicon_url} onChange={fc}
              placeholder="https://your-cdn.com/favicon.ico"
              className={inputClass} />
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact Email" name="contact_email" type="email" value={settings.contact_email} onChange={fc} placeholder="hello@neofuture.in" />
            <Field label="Contact Phone" name="contact_phone" value={settings.contact_phone} onChange={fc} placeholder="+91 98765 43210" />
            <Field label="WhatsApp Number" name="whatsapp_number" value={settings.whatsapp_number} onChange={fc} placeholder="919876543210 (no + or spaces)" />
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Business Address</label>
              <textarea name="address" value={settings.address} onChange={fc} rows={2}
                className={inputClass + ' resize-none'} placeholder="Your registered address" />
            </div>
          </div>
        </Section>

        {/* Social */}
        <Section title="Social Media">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Instagram URL" name="instagram_url" value={settings.instagram_url} onChange={fc} placeholder="https://instagram.com/neofuture" />
            <Field label="Facebook URL" name="facebook_url" value={settings.facebook_url} onChange={fc} placeholder="https://facebook.com/neofuture" />
          </div>
        </Section>

        {/* Payment */}
        <Section title="Payment">
          <div>
            <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">Razorpay Mode</label>
            <select name="razorpay_mode" value={settings.razorpay_mode} onChange={fc} className={inputClass}>
              <option value="test">Test Mode (use rzp_test_ keys)</option>
              <option value="live">Live Mode (use rzp_live_ keys)</option>
            </select>
            <p className="text-xs text-brand-gray mt-1">Remember to update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env.local when switching to live.</p>
          </div>
        </Section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-brand-dark mb-4 pb-3 border-b border-gray-100">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, name, value, onChange, type = 'text', placeholder }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-gray mb-1.5 uppercase">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />
    </div>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors'
