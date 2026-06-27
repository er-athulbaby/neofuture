import 'next-auth'

declare module 'next-auth' {
  interface User {
    is_admin?: boolean
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
      is_admin: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    is_admin?: boolean
  }
}
