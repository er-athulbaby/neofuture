import Link from 'next/link'

export const metadata = { title: 'Refund & Return Policy' }

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Legal</span>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Refund & Return Policy</h1>
        <p className="text-brand-gray text-sm">Last updated: June 2025</p>
      </div>

      <div className="space-y-8 text-brand-gray leading-relaxed text-sm">

        <p>
          At NeoFuture, we maintain strict quality and safety standards. Due to the personal hygiene and
          intimate nature of our products, our return and refund policy is designed to ensure the safety
          and satisfaction of all our customers.
        </p>

        <Section title="Return Eligibility">
          <p>We accept returns only under the following conditions:</p>
          <ul>
            <li>The product received is <strong className="text-brand-dark">damaged</strong>, <strong className="text-brand-dark">defective</strong>, or a <strong className="text-brand-dark">wrong item was delivered</strong></li>
            <li>The issue is reported within <strong className="text-brand-dark">48 hours of delivery</strong></li>
            <li>The item is <strong className="text-brand-dark">unused, unopened, and in its original packaging</strong></li>
          </ul>
        </Section>

        <Section title="Non-Returnable Items">
          <p>The following items are not eligible for return:</p>
          <ul>
            <li>Used or opened menstrual cups or hygiene products</li>
            <li>Products damaged due to improper use or mishandling by the customer</li>
            <li>Items purchased during clearance or sale (unless the item is defective)</li>
            <li>Items that are not in their original packaging</li>
          </ul>
        </Section>

        <Section title="How to Initiate a Return">
          <p>To request a return or replacement:</p>
          <ol>
            <li>Email us at <a href="mailto:info@neofuture.in" className="text-primary hover:underline font-medium">info@neofuture.in</a> within <strong className="text-brand-dark">48 hours of delivery</strong></li>
            <li>Include your <strong className="text-brand-dark">order number</strong> and <strong className="text-brand-dark">product details</strong></li>
            <li>Attach <strong className="text-brand-dark">photographic or video evidence</strong> of the damage or issue</li>
          </ol>
          <p className="mt-2 text-red-600 font-medium">Returns sent without prior approval will not be accepted.</p>
        </Section>

        <Section title="Refund Timeline">
          <p>
            Once we receive and inspect the returned item, we will notify you of the approval or rejection
            of your refund. Approved refunds are processed within{' '}
            <strong className="text-brand-dark">7–10 business days</strong> to the original payment method only.
          </p>
          <p>
            Shipping and handling charges are <strong className="text-brand-dark">non-refundable</strong>,
            unless the return is due to our error (wrong or defective item).
          </p>
        </Section>

        <Section title="Order Cancellations">
          <p>
            Orders can be cancelled <strong className="text-brand-dark">only before shipment</strong>. Once
            your order has been dispatched, cancellation requests cannot be accepted. To cancel an order,
            contact us immediately at{' '}
            <a href="mailto:info@neofuture.in" className="text-primary hover:underline font-medium">info@neofuture.in</a>.
          </p>
        </Section>

        <Section title="Damaged During Shipping">
          <p>
            If your package arrives visibly damaged, please <strong className="text-brand-dark">refuse the delivery</strong>{' '}
            or take photo/video evidence immediately upon receipt. Report it to us within 48 hours so we
            can arrange a replacement or refund.
          </p>
        </Section>

        <Section title="Our Right to Refuse Returns">
          <p>
            NeoFuture reserves the right to refuse a return or refund if the product does not meet the
            above eligibility criteria. We also reserve the right to update this policy at any time
            without prior notice.
          </p>
        </Section>

        <div className="bg-primary-light rounded-2xl p-5 mt-8">
          <p className="font-semibold text-brand-dark mb-1">Need Help?</p>
          <p className="text-sm text-brand-gray">
            Contact our support team at{' '}
            <a href="mailto:info@neofuture.in" className="text-primary hover:underline font-medium">info@neofuture.in</a>
            {' '}or{' '}
            <a href="tel:+919496109340" className="text-primary hover:underline font-medium">+91 94961 09340</a>.
            We're happy to assist you.
          </p>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-brand-dark mb-3">{title}</h2>
      <div className="space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5">
        {children}
      </div>
    </div>
  )
}
