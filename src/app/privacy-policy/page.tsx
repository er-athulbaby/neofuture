import Link from 'next/link'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Legal</span>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Privacy Policy</h1>
        <p className="text-brand-gray text-sm">Last updated: June 2025</p>
      </div>

      <div className="prose prose-sm max-w-none space-y-8 text-brand-gray leading-relaxed">

        <p>
          At NeoFuture, we are committed to protecting your privacy. This Privacy Policy explains how we collect,
          use, and safeguard your personal information when you visit or make a purchase from our website.
        </p>

        <Section title="1. Information We Collect">
          <p>We collect the following personal information when you place an order or create an account:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Billing and shipping address</li>
          </ul>
          <p>
            We also automatically collect non-personal information such as your IP address, browser type,
            and browsing behaviour through cookies and similar technologies.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your information to:</p>
          <ul>
            <li>Process and fulfil your orders</li>
            <li>Provide customer support</li>
            <li>Send order confirmations and delivery updates</li>
            <li>Improve our website and services</li>
            <li>Send promotional communications (only if you have opted in)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. Cookies & Tracking">
          <p>
            Our website uses cookies to enhance user experience, remember your preferences, and analyse website
            traffic. You may disable cookies through your browser settings; however, this may affect some
            features of our website.
          </p>
        </Section>

        <Section title="4. Sharing of Information">
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your
            information with trusted third-party service providers (such as payment gateways and shipping
            partners) solely to fulfil your orders, or with legal authorities when required by law.
          </p>
        </Section>

        <Section title="5. Payment Security">
          <p>
            All payments made on NeoFuture are processed through secure and encrypted third-party payment
            gateways. We do not store your card, UPI, or net banking details on our servers.
          </p>
        </Section>

        <Section title="6. Data Protection">
          <p>
            We implement appropriate security measures to protect your personal information against unauthorised
            access, alteration, or disclosure. Please note that no method of transmission over the internet is
            100% secure, and we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="7. Health Disclaimer">
          <p>
            Product information on our website is provided for general informational purposes only and does not
            constitute medical advice. Please consult a qualified healthcare professional for any health concerns.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction or update of your information</li>
            <li>Request deletion of your personal data</li>
            <li>Opt out of promotional communications at any time</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{' '}
            <a href="mailto:info@neofuture.in" className="text-primary hover:underline">info@neofuture.in</a>{' '}
            or call us at <a href="tel:+919496109340" className="text-primary hover:underline">+91 94961 09340</a>.
          </p>
        </Section>

        <Section title="9. Third-Party Links">
          <p>
            Our website may contain links to third-party websites. We are not responsible for the privacy
            practices or content of those sites. We encourage you to review the privacy policies of any
            external sites you visit.
          </p>
        </Section>

        <Section title="10. Children's Privacy">
          <p>
            Our products and services are not directed at children under the age of 18. We do not knowingly
            collect personal information from minors.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We reserve the right to update this Privacy Policy at any time. Changes will be posted on this
            page with an updated date. Continued use of our website after any changes constitutes your
            acceptance of the updated policy.
          </p>
        </Section>

        <div className="bg-primary-light rounded-2xl p-5 mt-8">
          <p className="font-semibold text-brand-dark mb-1">Contact Us</p>
          <p className="text-sm text-brand-gray">
            For any privacy-related queries, reach us at{' '}
            <a href="mailto:info@neofuture.in" className="text-primary hover:underline font-medium">info@neofuture.in</a>
            {' '}or{' '}
            <a href="tel:+919496109340" className="text-primary hover:underline font-medium">+91 94961 09340</a>.
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
      <div className="space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">{children}</div>
    </div>
  )
}
