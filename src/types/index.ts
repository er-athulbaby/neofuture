export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  is_admin: boolean
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image?: string
  display_order: number
}

export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  short_description?: string
  price: number
  sale_price?: number
  images: string[]
  category_id: number
  category_name?: string
  category_slug?: string
  stock: number
  is_featured: boolean
  is_active: boolean
  ingredients?: string
  how_to_use?: string
  flavor?: string
  weight?: string
  sku?: string
  avg_rating?: number
  review_count?: number
  tags: string[]
  custom_gst_rate?: number | null
  pack_format?: string | null
  serving_size?: string | null
  min_order_qty?: number
  created_at: string
}

export interface Review {
  id: number
  product_id: number
  user_id: string
  user_name: string
  rating: number
  comment?: string
  is_verified_purchase: boolean
  created_at: string
}

export interface CartItem {
  product_id: number
  name: string
  slug: string
  image: string
  price: number
  sale_price?: number
  quantity: number
  stock: number
  variant_id?: number
  variant_label?: string
  subscription_plan_id?: number
  subscription_months?: number
  subscription_label?: string
}

export interface SubscriptionPlan {
  id: number
  duration_months: number
  label: string
  price: number
}

export interface ProductVariant {
  id: number
  product_id: number
  label: string
  options: Record<string, string>
  price: number | null
  sale_price: number | null
  stock: number
  sku: string | null
  is_active: boolean
  created_at: string
}

export interface Order {
  id: number
  order_number: string
  user_id?: string
  guest_email?: string
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  razorpay_order_id?: string
  razorpay_payment_id?: string
  shipping_address: ShippingAddress
  tracking_number?: string
  notes?: string
  items?: OrderItem[]
  coupon_code?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  product_image?: string
  quantity: number
  price: number
  total: number
}

export interface ShippingAddress {
  name: string
  phone: string
  email?: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country?: string
}

export interface Coupon {
  id: number
  code: string
  type: 'percent' | 'flat'
  value: number
  min_order: number
  usage_limit?: number
  used_count: number
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface QuizSession {
  id: number
  user_id?: string
  session_key?: string
  age_group: string
  main_concern: string
  quiz_path: 'pcos' | 'sleep_stress' | 'energy'
  answers: Record<string, string | string[]>
  hormone_score?: number
  stress_score?: number
  energy_score?: number
  recommended_product_id?: number
  completed: boolean
  created_at: string
}

export interface WellnessLead {
  id: number
  name: string
  whatsapp: string
  email?: string
  quiz_session_id?: number
  recommended_product: string
  quiz_path: string
  hormone_score?: number
  stress_score?: number
  energy_score?: number
  is_contacted: boolean
  notes?: string
  created_at: string
}

export interface BabyProfile {
  id: number
  user_id: string
  name: string
  dob: string
  gender: 'male' | 'female'
  created_at: string
}

export interface VaccinationLog {
  id: number
  baby_id: number
  vaccine_name: string
  scheduled_date: string
  given_date?: string
  batch_number?: string
  notes?: string
}

export interface AnalyticsOverview {
  total_revenue: number
  total_orders: number
  avg_order_value: number
  total_customers: number
  total_leads: number
  quiz_completions: number
  revenue_by_day: { date: string; revenue: number; orders: number }[]
  top_products: { product_id: number; name: string; revenue: number; units: number }[]
  orders_by_status: { status: string; count: number }[]
  quiz_paths: { path: string; count: number }[]
  funnel: {
    visits: number
    quiz_starts: number
    quiz_completions: number
    product_views: number
    add_to_cart: number
    purchases: number
  }
}
