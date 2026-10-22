import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import PostgresAdapter from '@auth/pg-adapter'
import pool from './db'
import bcrypt from 'bcryptjs'
import { queryOne } from './db'
import { verify as verifyTotp } from './totp'

const providers = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      totp_code: { label: '2FA Code', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null

      const user = await queryOne<{
        id: string
        name: string
        email: string
        password_hash: string
        is_admin: boolean
        image: string
        totp_enabled: boolean
        totp_secret: string | null
      }>('SELECT id, name, email, password_hash, is_admin, image, totp_enabled, totp_secret FROM users WHERE email = $1', [
        credentials.email,
      ])

      if (!user || !user.password_hash) return null

      const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
      if (!valid) return null

      // If admin has TOTP enabled, require and verify the code
      if (user.is_admin && user.totp_enabled && user.totp_secret) {
        const code = credentials.totp_code as string
        if (!code) return null
        const totpValid = verifyTotp(code, user.totp_secret)
        if (!totpValid) return null
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        is_admin: user.is_admin,
      }
    },
  }),
]

// Add Google provider only when credentials are configured
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }) as never
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,    // 24-hour session lifetime
    updateAge: 6 * 60 * 60,  // refresh token every 6 hours of activity
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.is_admin = (user as { is_admin?: boolean }).is_admin ?? false
      }
      // Always refresh from DB — JWT cache would hide revoked admin access
      if (token.id) {
        const dbUser = await queryOne<{ is_admin: boolean; is_doctor: boolean }>(
          'SELECT is_admin, is_doctor FROM users WHERE id = $1',
          [token.id]
        )
        token.is_admin = dbUser?.is_admin ?? false
        token.is_doctor = dbUser?.is_doctor ?? false

        // TOTP check (admin only)
        if (dbUser?.is_admin) {
          // Ensure columns exist — no-op once created
          await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false`, []).catch(() => {})
          await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMPTZ`, []).catch(() => {})

          const totpRow = await queryOne<{ totp_enabled: boolean; totp_verified_at: string | null }>(
            `SELECT totp_enabled, totp_verified_at FROM users WHERE id = $1`,
            [token.id]
          ).catch(() => null)

          if (totpRow?.totp_enabled) {
            const verifiedAt = totpRow.totp_verified_at ? new Date(totpRow.totp_verified_at).getTime() : 0
            token.totp_pending = verifiedAt < Date.now() - 24 * 60 * 60 * 1000
          } else {
            token.totp_pending = false
          }
        } else {
          token.totp_pending = false
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.is_admin = token.is_admin as boolean
        session.user.is_doctor = token.is_doctor as boolean
        session.user.totp_pending = token.totp_pending as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
