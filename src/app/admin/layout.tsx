import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.is_admin) redirect('/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
