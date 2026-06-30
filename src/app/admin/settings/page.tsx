'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { Settings, Save, Upload, Image as ImageIcon, Palette, Type, Share2 } from 'lucide-react'

type Cfg = {
  site_name: string; tagline: string; logo_url: string; favicon_url: string
  hero_title: string; hero_subtitle: string
  dashboard_title: string; dashboard_subtitle: string
  period_title: string; period_subtitle: string
  community_title: string; community_subtitle: string; community_whatsapp: string
  about_title: string; about_text: string; about_image: string
  contact_email: string; contact_phone: string; whatsapp_number: string; address: string
  instagram_url: string; facebook_url: string; instagram_posts: string
  color_primary: string; color_primary_dark: string; color_primary_light: string
  color_neo_orange: string; color_neo_purple: string; color_brand_dark: string
  razorpay_mode: string
  cod_enabled: string
  gst_rate: string
  gst_type: string
}

const D: Cfg = {
  site_name: 'NeoFuture', tagline: 'From trusted hands to quality lives',
  logo_url: '', favicon_url: '',
  hero_title: 'Welcome to the Next Generation of Healthcare',
  hero_subtitle: 'Experience the future of healthcare through intelligent AI, powered by trusted Doctors.',
  dashboard_title: 'Your AI-Powered Wellness Dashboard',
  dashboard_subtitle: "Our AI-powered wellness dashboard isn't just about numbers and data; it's a daily reflection of your holistic health.",
  period_title: 'Advanced AI Cycle Tracking',
  period_subtitle: 'Advanced AI cycle tracking that predicts periods, ovulation, and fertile windows.',
  community_title: 'Join the Bloom Story Community',
  community_subtitle: 'Where 200+ women and mothers connect, share experiences, and receive trusted guidance.',
  community_whatsapp: '',
  about_title: 'About NeoFuture',
  about_text: 'We are a team of passionate women, doctors, and wellness experts.',
  about_image: '',
  contact_email: '', contact_phone: '', whatsapp_number: '', address: '',
  instagram_url: '', facebook_url: '', instagram_posts: '',
  color_primary: '#D4236A', color_primary_dark: '#A81B54', color_primary_light: '#FBE8F2',
  color_neo_orange: '#E07B2A', color_neo_purple: '#7B35A8', color_brand_dark: '#1A1535',
  razorpay_mode: 'test',
  cod_enabled: 'false',
  gst_rate: '0',
  gst_type: 'inclusive',
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [s, setS] = useState<Cfg>(D)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const aboutRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => { if (d.settings) setS({ ...D, ...d.settings }) })
      .finally(() => setLoading(false))
  }, [])

  const fc = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setS((x) => ({ ...x, [e.target.name]: e.target.value }))

  async function uploadFile(file: File, field: string) {
    setUploading(field)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.url) {
        const newUrl: string = data.url
        setS((x) => ({ ...x, [field]: newUrl }))
        // Auto-save this field immediately so layout picks it up on next load
        await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: newUrl }),
        })
        toast(`Uploaded & saved! Refresh the page to see the new ${field === 'favicon_url' ? 'favicon' : 'logo'}.`)
      } else {
        toast(data.error ?? 'Upload failed', 'error')
      }
    } catch { toast('Upload failed', 'error') }
    finally { setUploading(null) }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    setSaving(false)
    if (res.ok) { toast('Settings saved! Refresh to see color changes.') }
    else toast('Failed to save', 'error')
  }

  if (loading) return <div className="p-8 text-brand-gray">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-brand-dark mb-6 flex items-center gap-2">
        <Settings size={20} className="text-primary" /> Site Settings
      </h1>

      <form onSubmit={save} className="space-y-5">

        {/* Branding */}
        <Sec icon={<ImageIcon size={16} />} title="Branding & Logo">
          <Row>
            <F label="Site Name" name="site_name" value={s.site_name} onChange={fc} />
            <F label="Tagline" name="tagline" value={s.tagline} onChange={fc} />
          </Row>
          <div>
            <label className={lbl}>Logo</label>
            <div className="flex gap-3 items-center">
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'logo_url')} />
              <input name="logo_url" value={s.logo_url} onChange={fc} placeholder="/uploads/logo.png or https://..." className={inp} />
              <button type="button" onClick={() => logoRef.current?.click()}
                className="flex-shrink-0 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-brand-dark px-3 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <Upload size={14} /> {uploading === 'logo_url' ? '...' : 'Upload'}
              </button>
            </div>
            {s.logo_url && <img src={s.logo_url} alt="preview" className="mt-2 h-10 object-contain rounded-lg border border-gray-100 px-2" />}
          </div>
          <div>
            <label className={lbl}>Favicon</label>
            <div className="flex gap-3 items-center">
              <input ref={faviconRef} type="file" accept="image/*,.ico" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'favicon_url')} />
              <input name="favicon_url" value={s.favicon_url} onChange={fc} placeholder="/uploads/favicon.ico" className={inp} />
              <button type="button" onClick={() => faviconRef.current?.click()}
                className="flex-shrink-0 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-brand-dark px-3 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <Upload size={14} /> {uploading === 'favicon_url' ? '...' : 'Upload'}
              </button>
            </div>
            {s.favicon_url && <img src={s.favicon_url} alt="favicon" className="mt-2 w-8 h-8 object-contain rounded border border-gray-100" />}
          </div>
        </Sec>

        {/* Homepage Content */}
        <Sec icon={<Type size={16} />} title="Homepage Content">
          <F label="Hero Title" name="hero_title" value={s.hero_title} onChange={fc} />
          <TextA label="Hero Subtitle" name="hero_subtitle" value={s.hero_subtitle} onChange={fc} />
          <F label="Dashboard Section Title" name="dashboard_title" value={s.dashboard_title} onChange={fc} />
          <TextA label="Dashboard Section Text" name="dashboard_subtitle" value={s.dashboard_subtitle} onChange={fc} />
          <F label="Period Tracker Title" name="period_title" value={s.period_title} onChange={fc} />
          <TextA label="Period Tracker Text" name="period_subtitle" value={s.period_subtitle} onChange={fc} />
          <F label="Community Title" name="community_title" value={s.community_title} onChange={fc} />
          <TextA label="Community Subtitle" name="community_subtitle" value={s.community_subtitle} onChange={fc} />
          <F label="WhatsApp Community Link (number only, e.g. 919876543210)" name="community_whatsapp" value={s.community_whatsapp} onChange={fc} placeholder="919876543210" />
          <F label="About Us Title" name="about_title" value={s.about_title} onChange={fc} />
          <TextA label="About Us Text" name="about_text" value={s.about_text} onChange={fc} rows={4} />
          <div>
            <label className={lbl}>About Us / Team Photo</label>
            <div className="flex gap-3 items-center">
              <input ref={aboutRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'about_image')} />
              <input name="about_image" value={s.about_image} onChange={fc} placeholder="/uploads/team.jpg" className={inp} />
              <button type="button" onClick={() => aboutRef.current?.click()}
                className="flex-shrink-0 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-brand-dark px-3 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <Upload size={14} /> {uploading === 'about_image' ? '...' : 'Upload'}
              </button>
            </div>
            {s.about_image && <img src={s.about_image} alt="preview" className="mt-2 h-20 object-cover rounded-xl border border-gray-100" />}
          </div>
        </Sec>

        {/* Theme Colors */}
        <Sec icon={<Palette size={16} />} title="Theme Colors">
          <p className="text-xs text-brand-gray -mt-1">Changes take effect on next page refresh (no rebuild needed).</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ColorField label="Primary Color" name="color_primary" value={s.color_primary} onChange={fc} />
            <ColorField label="Primary Dark" name="color_primary_dark" value={s.color_primary_dark} onChange={fc} />
            <ColorField label="Primary Light" name="color_primary_light" value={s.color_primary_light} onChange={fc} />
            <ColorField label="Neo Orange" name="color_neo_orange" value={s.color_neo_orange} onChange={fc} />
            <ColorField label="Neo Purple" name="color_neo_purple" value={s.color_neo_purple} onChange={fc} />
            <ColorField label="Brand Dark" name="color_brand_dark" value={s.color_brand_dark} onChange={fc} />
          </div>
          <div className="mt-3 flex gap-3 flex-wrap">
            <div className="h-10 rounded-xl flex-1 min-w-20" style={{ background: s.color_primary }} title="Primary" />
            <div className="h-10 rounded-xl flex-1 min-w-20" style={{ background: s.color_neo_orange }} title="Orange" />
            <div className="h-10 rounded-xl flex-1 min-w-20" style={{ background: s.color_neo_purple }} title="Purple" />
            <div className="h-10 rounded-xl flex-1 min-w-20" style={{ background: s.color_brand_dark }} title="Dark" />
          </div>
        </Sec>

        {/* Instagram */}
        <Sec icon={<Share2 size={16} />} title="Instagram Feed">
          <F label="Instagram Profile URL" name="instagram_url" value={s.instagram_url} onChange={fc} placeholder="https://instagram.com/neofuture" />
          <div>
            <label className={lbl}>Instagram Post URLs (comma-separated)</label>
            <TextA name="instagram_posts" value={s.instagram_posts} onChange={fc} rows={3}
              placeholder="https://instagram.com/p/ABC123, https://instagram.com/p/DEF456" />
            <p className="text-xs text-brand-gray mt-1">Paste Instagram post URLs separated by commas. These show as a grid on the homepage.</p>
          </div>
        </Sec>

        {/* Contact */}
        <Sec icon={<Settings size={16} />} title="Contact Information">
          <Row>
            <F label="Contact Email" name="contact_email" type="email" value={s.contact_email} onChange={fc} placeholder="hello@neofuture.in" />
            <F label="Contact Phone" name="contact_phone" value={s.contact_phone} onChange={fc} placeholder="+91 98765 43210" />
          </Row>
          <Row>
            <F label="WhatsApp Number" name="whatsapp_number" value={s.whatsapp_number} onChange={fc} placeholder="919876543210" />
            <F label="Facebook URL" name="facebook_url" value={s.facebook_url} onChange={fc} placeholder="https://facebook.com/neofuture" />
          </Row>
          <div>
            <label className={lbl}>Business Address</label>
            <TextA name="address" value={s.address} onChange={fc} rows={2} placeholder="Your registered address" />
          </div>
        </Sec>

        {/* Payment */}
        <Sec icon={<Settings size={16} />} title="Payment">
          <div>
            <label className={lbl}>Razorpay Mode</label>
            <select name="razorpay_mode" value={s.razorpay_mode} onChange={fc} className={inp}>
              <option value="test">Test Mode (use rzp_test_ keys)</option>
              <option value="live">Live Mode (use rzp_live_ keys)</option>
            </select>
          </div>
          <div className="space-y-3">
            <div>
              <label className={lbl}>GST Rate (%)</label>
              <input
                name="gst_rate"
                type="number"
                min="0"
                max="28"
                step="1"
                value={s.gst_rate}
                onChange={fc}
                className={inp}
                placeholder="0 = disabled, 5 / 12 / 18 / 28"
              />
            </div>
            {Number(s.gst_rate) > 0 && (
              <div>
                <label className={lbl}>GST Pricing Type</label>
                <div className="flex gap-3">
                  <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors flex-1 ${s.gst_type === 'inclusive' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="gst_type"
                      value="inclusive"
                      checked={s.gst_type === 'inclusive'}
                      onChange={fc}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">Inclusive</p>
                      <p className="text-xs text-brand-gray">Price already includes GST. Shown as breakdown (no change to total).</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors flex-1 ${s.gst_type === 'exclusive' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="gst_type"
                      value="exclusive"
                      checked={s.gst_type === 'exclusive'}
                      onChange={fc}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">Exclusive</p>
                      <p className="text-xs text-brand-gray">GST added on top at checkout. Total increases by {s.gst_rate}%.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-brand-dark">Cash on Delivery (COD)</p>
              <p className="text-xs text-brand-gray mt-0.5">Allow customers to pay on delivery. Useful for testing without Razorpay.</p>
            </div>
            <button
              type="button"
              onClick={() => setS((x) => ({ ...x, cod_enabled: x.cod_enabled === 'true' ? 'false' : 'true' }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${s.cod_enabled === 'true' ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${s.cod_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {s.cod_enabled === 'true' && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              ⚠️ COD is currently <strong>enabled</strong>. Customers can place orders without online payment. Disable this before going live if you want to enforce online payment.
            </p>
          )}
        </Sec>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors">
            <Save size={16} /> {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── helpers ─────────────────────────────────────────────────────────────────

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors'
const lbl = 'block text-xs font-semibold text-brand-gray mb-1.5 uppercase tracking-wide'

function Sec({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold text-brand-dark mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
        <span className="text-primary">{icon}</span> {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

function F({ label, name, value, onChange, type = 'text', placeholder }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={inp} />
    </div>
  )
}

function TextA({ label, name, value, onChange, rows = 2, placeholder }: {
  label?: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number; placeholder?: string
}) {
  return (
    <div>
      {label && <label className={lbl}>{label}</label>}
      <textarea name={name} value={value} onChange={onChange} rows={rows} placeholder={placeholder} className={inp + ' resize-none'} />
    </div>
  )
}

function ColorField({ label, name, value, onChange }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      <div className="flex gap-2 items-center">
        <input type="color" name={name} value={value} onChange={onChange}
          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
        <input type="text" name={name} value={value} onChange={onChange}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary" />
      </div>
    </div>
  )
}
