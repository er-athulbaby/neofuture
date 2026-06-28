'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQS = [
  {
    category: 'General Questions',
    items: [
      { q: 'What is NeoFuture?', a: "NeoFuture is an Indian eCommerce brand focused on women's health and hygiene products such as menstrual cups, menstrual cup sterilizers, and heat patches." },
      { q: 'Are NeoFuture products safe to use?', a: 'Yes. All our products are made using high‑quality, skin‑safe materials and are designed to meet hygiene and safety standards. Please follow the instructions provided with each product.' },
      { q: 'Do I need a prescription to buy your products?', a: 'No. Our products are meant for personal hygiene and comfort and do not require a medical prescription.' },
      { q: 'Do you ship internationally?', a: 'No. Currently, NeoFuture delivers only within India. We hope to expand internationally in the future.' },
    ],
  },
  {
    category: 'Payment Methods',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept secure online payments through: Credit Cards & Debit Cards, UPI (Google Pay, PhonePe, Paytm, etc.), and Net Banking — all through secure, encrypted payment gateways.' },
      { q: 'Do you offer Cash on Delivery (COD)?', a: 'No. We currently do not offer Cash on Delivery (COD). All orders must be prepaid using the available online payment options.' },
      { q: 'Is online payment safe on NeoFuture?', a: 'Yes. Our website uses secure payment gateways and encryption technologies. NeoFuture does not store your card or UPI details.' },
    ],
  },
  {
    category: 'Orders & Returns',
    items: [
      { q: 'How long does delivery take?', a: 'Orders are usually delivered within 3–7 business days after dispatch, depending on your location within India.' },
      { q: 'What is your return policy?', a: 'Due to hygiene and safety reasons, opened or used products are not eligible for return. Only damaged, defective, or incorrect items qualify for return — and must be reported within 48 hours of delivery in their original, unopened packaging.' },
      { q: 'How do I request a return or replacement?', a: 'Contact our customer support at info@neofuture.in within 48 hours of receiving your package, along with your order number and photographic evidence of the issue. Returns sent without prior approval will not be accepted.' },
      { q: 'Will I receive a refund if my return is approved?', a: 'Approved refunds will be processed to the original payment method within 7–10 business days after inspection.' },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-brand-dark text-sm">{q}</span>
        {open ? <ChevronUp size={16} className="text-primary flex-shrink-0" /> : <ChevronDown size={16} className="text-brand-gray flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 bg-white">
          <p className="text-brand-gray text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQClient() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Support</span>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Frequently Asked Questions</h1>
        <p className="text-brand-gray">Everything you need to know about NeoFuture products and orders.</p>
      </div>

      <div className="space-y-10">
        {FAQS.map((section) => (
          <div key={section.category}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">{section.category}</h2>
            <div className="space-y-2">
              {section.items.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-primary-light rounded-2xl p-6 text-center">
        <p className="font-semibold text-brand-dark mb-1">Still have questions?</p>
        <p className="text-sm text-brand-gray mb-4">Our team is happy to help you.</p>
        <a href="mailto:info@neofuture.in"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
          Email Us — info@neofuture.in
        </a>
      </div>
    </div>
  )
}
