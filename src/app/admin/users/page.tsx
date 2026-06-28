import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminUsersClient from './AdminUsersClient'

export const metadata = { title: 'Users | Admin' }

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/login')
  return <AdminUsersClient currentUserId={session.user.id ?? ''} />
}
