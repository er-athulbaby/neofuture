import Link from 'next/link'
import { Search, Home, ShoppingBag, Stethoscope } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-bold text-primary/20 mb-4 select-none">404</div>
      <h1 className="text-2xl font-bold text-brand-dark mb-2">Page not found</h1>
      <p className="text-brand-gray mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md mb-8">
        <Link href="/"
          className="flex items-center gap-2 justify-center px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-brand-dark hover:bg-primary/5 hover:border-primary/30 transition-colors">
          <Home size={16} className="text-primary" /> Home
        </Link>
        <Link href="/shop"
          className="flex items-center gap-2 justify-center px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-brand-dark hover:bg-primary/5 hover:border-primary/30 transition-colors">
          <ShoppingBag size={16} className="text-primary" /> Shop
        </Link>
        <Link href="/consult"
          className="flex items-center gap-2 justify-center px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-brand-dark hover:bg-primary/5 hover:border-primary/30 transition-colors">
          <Stethoscope size={16} className="text-primary" /> Consult
        </Link>
      </div>

      <Link href="/"
        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
        <Home size={16} /> Back to Home
      </Link>
    </div>
  )
}
