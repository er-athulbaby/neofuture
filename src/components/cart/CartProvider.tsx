'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import type { CartItem } from '@/types'

interface CartState { items: CartItem[] }

type CartAction =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; product_id: number; variant_id?: number }
  | { type: 'UPDATE'; product_id: number; quantity: number; variant_id?: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] }

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: CartItem) => void
  removeItem: (product_id: number, variant_id?: number) => void
  updateItem: (product_id: number, quantity: number, variant_id?: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

function matchItem(i: CartItem, product_id: number, variant_id?: number) {
  return i.product_id === product_id && (i.variant_id ?? undefined) === (variant_id ?? undefined)
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD':
      return { items: action.items }

    case 'ADD': {
      const existing = state.items.find((i) =>
        matchItem(i, action.item.product_id, action.item.variant_id)
      )
      if (existing) {
        return {
          items: state.items.map((i) =>
            matchItem(i, action.item.product_id, action.item.variant_id)
              ? { ...i, quantity: Math.min(i.quantity + action.item.quantity, i.stock) }
              : i
          ),
        }
      }
      return { items: [...state.items, action.item] }
    }

    case 'REMOVE':
      return { items: state.items.filter((i) => !matchItem(i, action.product_id, action.variant_id)) }

    case 'UPDATE':
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => !matchItem(i, action.product_id, action.variant_id)) }
      }
      return {
        items: state.items.map((i) =>
          matchItem(i, action.product_id, action.variant_id)
            ? { ...i, quantity: Math.min(action.quantity, i.stock) }
            : i
        ),
      }

    case 'CLEAR':
      return { items: [] }

    default:
      return state
  }
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nf_cart')
      if (stored) dispatch({ type: 'LOAD', items: JSON.parse(stored) })
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('nf_cart', JSON.stringify(state.items))
  }, [state.items])

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = state.items.reduce((sum, i) => sum + (i.sale_price ?? i.price) * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        itemCount,
        subtotal,
        addItem: (item) => dispatch({ type: 'ADD', item }),
        removeItem: (id, vid) => dispatch({ type: 'REMOVE', product_id: id, variant_id: vid }),
        updateItem: (id, qty, vid) => dispatch({ type: 'UPDATE', product_id: id, quantity: qty, variant_id: vid }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
