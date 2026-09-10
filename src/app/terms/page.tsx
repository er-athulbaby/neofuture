import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for using NeoFuture products and telemedicine services.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-dark mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-brand-gray mb-8">Last updated: September 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-brand-dark">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-brand-gray leading-relaxed">By accessing or using the NeoFuture website at neofuture.in ("Site"), purchasing our products, or using our telemedicine consultation services, you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Products &amp; Orders</h2>
          <ul className="list-disc pl-5 space-y-2 text-brand-gray">
            <li>All product descriptions, pricing, and availability are subject to change without notice.</li>
            <li>We reserve the right to refuse or cancel any order at our discretion.</li>
            <li>Prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise.</li>
            <li>Payment is processed securely via Razorpay. We do not store your card details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Telemedicine Consultation Services</h2>
          <ul className="list-disc pl-5 space-y-2 text-brand-gray">
            <li>Consultations are provided by licensed medical professionals registered with the appropriate medical councils.</li>
            <li>Telemedicine services are for general wellness guidance and do not replace in-person medical care for emergency situations.</li>
            <li>Prescriptions issued through our platform comply with applicable telemedicine guidelines in India.</li>
            <li>Consultation fees are non-refundable once the session has commenced.</li>
            <li>You must provide accurate health information during consultations. We are not liable for advice given based on incorrect or incomplete information.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. User Accounts</h2>
          <ul className="list-disc pl-5 space-y-2 text-brand-gray">
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You must be at least 18 years old to create an account and purchase products or services.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. NeoPulse Loyalty Program</h2>
          <ul className="list-disc pl-5 space-y-2 text-brand-gray">
            <li>NeoPulse points are earned on eligible purchases and have no cash value.</li>
            <li>Points may be redeemed for discounts as per the current redemption rate.</li>
            <li>NeoFuture reserves the right to modify or discontinue the NeoPulse program at any time.</li>
            <li>Points expire 12 months after the last qualifying purchase.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
          <p className="text-brand-gray leading-relaxed">All content on this Site — including text, graphics, logos, images, and software — is the property of NeoFuture and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written permission.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
          <p className="text-brand-gray leading-relaxed">Our products and services are provided "as is" without any warranties, express or implied. Health information on this Site is for educational purposes only and is not a substitute for professional medical advice.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
          <p className="text-brand-gray leading-relaxed">NeoFuture shall not be liable for any indirect, incidental, or consequential damages arising from your use of our products or services. Our maximum liability shall not exceed the amount paid by you for the specific product or service giving rise to the claim.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
          <p className="text-brand-gray leading-relaxed">These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
          <p className="text-brand-gray leading-relaxed">We may update these terms from time to time. Continued use of our Site after changes constitutes acceptance of the revised terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
          <p className="text-brand-gray leading-relaxed">For questions about these terms, please contact us at <a href="mailto:support@neofuture.in" className="text-primary hover:underline">support@neofuture.in</a>.</p>
        </section>

      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4 text-sm">
        <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
        <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
      </div>
    </div>
  )
}
