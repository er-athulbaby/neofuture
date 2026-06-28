import { query } from './db'

export interface SiteConfig {
  site_name: string
  tagline: string
  logo_url: string
  hero_title: string
  hero_subtitle: string
  dashboard_title: string
  dashboard_subtitle: string
  period_title: string
  period_subtitle: string
  community_title: string
  community_subtitle: string
  community_whatsapp: string
  about_title: string
  about_text: string
  about_image: string
  contact_email: string
  contact_phone: string
  whatsapp_number: string
  address: string
  instagram_url: string
  facebook_url: string
  instagram_posts: string
  color_primary: string
  color_primary_dark: string
  color_primary_light: string
  color_neo_orange: string
  color_neo_purple: string
  color_brand_dark: string
}

export const CONFIG_DEFAULTS: SiteConfig = {
  site_name: 'NeoFuture',
  tagline: 'From trusted hands to quality lives',
  logo_url: '',
  hero_title: 'Welcome to the Next Generation of Healthcare',
  hero_subtitle: 'Experience the future of healthcare through intelligent AI, powered by trusted Doctors — providing personalized care with precision, confidence, and compassion.',
  dashboard_title: 'Your AI-Powered Wellness Dashboard',
  dashboard_subtitle: "Our AI-powered wellness dashboard isn't just about numbers and data; it's a daily reflection of your holistic health. See your insights, track your unique rhythm, and feel deeply understood every time you log in.",
  period_title: 'Advanced AI Cycle Tracking',
  period_subtitle: 'Advanced AI cycle tracking that predicts periods, ovulation, and fertile windows while delivering personalized insights and timely notifications for every stage of your cycle.',
  community_title: 'Join the Bloom Story Community',
  community_subtitle: 'Where 200+ women and mothers connect, share experiences, and receive trusted, live guidance from certified doctors.',
  community_whatsapp: '',
  about_title: 'About NeoFuture',
  about_text: 'We are a team of passionate women, doctors, and wellness experts committed to transforming how women understand and care for their bodies.',
  about_image: '',
  contact_email: '',
  contact_phone: '',
  whatsapp_number: '',
  address: '',
  instagram_url: '',
  facebook_url: '',
  instagram_posts: '',
  color_primary: '#D4236A',
  color_primary_dark: '#A81B54',
  color_primary_light: '#FBE8F2',
  color_neo_orange: '#E07B2A',
  color_neo_purple: '#7B35A8',
  color_brand_dark: '#1A1535',
}

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    await query(`CREATE TABLE IF NOT EXISTS site_settings (key VARCHAR(100) PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`, [])
    const rows = await query<{ key: string; value: string }>(`SELECT key, value FROM site_settings`, [])
    const map: Record<string, string> = {}
    rows.forEach((r) => { map[r.key] = r.value })
    return { ...CONFIG_DEFAULTS, ...map } as SiteConfig
  } catch {
    return CONFIG_DEFAULTS
  }
}
