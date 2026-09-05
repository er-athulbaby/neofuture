import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import pool from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_doctor BOOLEAN DEFAULT false;

    CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name VARCHAR(200) NOT NULL,
      photo_url TEXT,
      qualification VARCHAR(200),
      specialisation VARCHAR(100),
      bio TEXT,
      consultation_fee INTEGER NOT NULL DEFAULT 299,
      registration_no VARCHAR(100),
      state_medical_council VARCHAR(200),
      signature_url TEXT,
      google_refresh_token TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS doctor_availability (
      id SERIAL PRIMARY KEY,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      slot_duration INTEGER DEFAULT 30
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES users(id),
      doctor_id INTEGER REFERENCES doctors(id),
      slot_datetime TIMESTAMPTZ NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      google_event_id TEXT,
      meet_link TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      neopulse_redeemed INTEGER DEFAULT 0,
      neopulse_points_used INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      parent_consultation_id INTEGER REFERENCES consultations(id),
      is_followup BOOLEAN DEFAULT false,
      followup_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS consultation_reports (
      id SERIAL PRIMARY KEY,
      consultation_id INTEGER REFERENCES consultations(id) ON DELETE CASCADE,
      diagnosis TEXT,
      notes TEXT,
      prescription JSONB DEFAULT '[]',
      additional_instructions TEXT,
      followup_weeks INTEGER,
      followup_date DATE,
      wellness_snapshot JSONB DEFAULT '{}',
      pdf_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  return NextResponse.json({ success: true, message: 'Consultation tables created' })
}
