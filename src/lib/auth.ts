import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import PostgresAdapter from '@auth/pg-adapter'
import pool from './db'
import bcrypt from 'bcryptjs'
import { queryOne } from './db'

const providers = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null

      const user = await queryOne<{
        id: string
        name: string
        email: string
        password_hash: string
        is_admin: boolean
        avatar: string
      }>('SELECT id, name, email, password_hash, is_admin, avatar FROM users WHERE email = $1', [
        credentials.email,
      ])

      if (!user || !user.password_hash) return null

      const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
      if (!valid) return null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.avatar,
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
      // Always refresh is_admin from DB — JWT cache would hide revoked admin access
      if (token.id) {
        const dbUser = await queryOne<{ is_admin: boolean; is_doctor: boolean }>(
          'SELECT is_admin, is_doctor FROM users WHERE id = $1',
          [token.id]
        )
        token.is_admin = dbUser?.is_admin ?? false
        token.is_doctor = dbUser?.is_doctor ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.is_admin = token.is_admin as boolean
        session.user.is_doctor = token.is_doctor as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
