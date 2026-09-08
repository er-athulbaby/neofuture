export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto', background: '#F0F4F8' }}>
      {children}
    </div>
  )
}
