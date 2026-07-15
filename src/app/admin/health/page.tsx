import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminHealthClient from './AdminHealthClient'

export const metadata = { title: 'Health Data — Admin' }

export default async function AdminHealthPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/login')

  return <AdminHealthClient />
}
