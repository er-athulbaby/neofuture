import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (!session.user.is_doctor && !session.user.is_admin) redirect('/')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto', background: '#F0F4F8' }}>
      {children}
    </div>
  )
}
