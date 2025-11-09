import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      {/* Hero Section */}
      <section className="privacy-hero">
        <div className="container">
          <div className="privacy-hero-content">
            <h1>Privacy Policy</h1>
            <p>Your privacy matters to us. Here&apos;s how we protect your data.</p>
            <p className="terms-last-updated">
              <strong>Last updated:</strong> November 2025
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="privacy-content">
        <div className="container">
          <div className="privacy-sections">
            <div className="privacy-section">
              <h2>Privacy Policy</h2>
              <p>
                Your privacy matters to us. This policy explains how Inigo, developed and operated
                by Asaf Gadassi, collects, uses, and protects your information.
              </p>
            </div>

            <div className="privacy-section">
              <h2>Data Collection</h2>
              <p>We collect only what&apos;s necessary to provide a meaningful meditation experience:</p>
              <ul>
                <li>
                  <strong>Email address</strong> – for secure account creation and login (via Google
                  or Apple Sign-In)
                </li>
                <li>
                  <strong>Device information</strong> – such as model and operating system, to ensure
                  proper performance
                </li>
                <li>
                  <strong>Meditation sessions</strong> – duration and time, used to contribute
                  anonymously to our collective world state
                </li>
                <li>
                  <strong>Optional reflections and photos</strong> – only if you choose to share them
                  within the community
                </li>
              </ul>
              <p>
                We do not collect sensitive personal information such as location history beyond
                what is required to show nearby meditation spots (if permission is granted).
              </p>
            </div>

            <div className="privacy-section">
              <h2>How We Use Your Data</h2>
              <p>Your data helps us:</p>
              <ul>
                <li>Create and maintain your account securely</li>
                <li>Provide personalized and reliable meditation experiences</li>
                <li>Update collective world-state metrics (anonymously)</li>
                <li>Improve Inigo based on community feedback</li>
                <li>Send essential updates about features or account information</li>
              </ul>
              <p>We do not use your data for advertising or sell it to third parties.</p>
            </div>

            <div className="privacy-section">
              <h2>Third-Party Services</h2>
              <p>Inigo uses trusted services to operate safely and efficiently:</p>
              <ul>
                <li>
                  <strong>Firebase</strong> (Authentication, Storage, Analytics) – to handle login,
                  store photos, and measure performance
                </li>
                <li>
                  <strong>Django Backend</strong> – to manage user profiles and meditation data
                  securely on our private server
                </li>
              </ul>
              <p>
                These services follow industry-standard security practices and comply with GDPR and
                other applicable privacy regulations.
              </p>
            </div>

            <div className="privacy-section">
              <h2>Data Protection</h2>
              <p>We take your privacy seriously:</p>
              <ul>
                <li>All communication is encrypted in transit (HTTPS) and at rest</li>
                <li>Access to data is strictly limited to necessary operations</li>
                <li>Shared experiences are visible only according to your sharing choices</li>
                <li>Meditation statistics are aggregated anonymously</li>
              </ul>
            </div>

            <div className="privacy-section">
              <h2>Your Rights</h2>
              <p>You have full control over your information:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Update or correct inaccurate details</li>
                <li>Delete your account and all related data</li>
                <li>Opt out of emails or communications</li>
                <li>Export your data in a portable format upon request</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a>.
              </p>
            </div>

            <div className="privacy-section">
              <h2>Data Retention</h2>
              <p>
                We keep your information only as long as needed to provide the service or as required
                by law. If you delete your account, all personal data will be removed within a
                reasonable timeframe.
              </p>
            </div>

            <div className="privacy-section">
              <h2>Children&apos;s Privacy</h2>
              <p>
                Inigo is intended for users aged 16 and older. We do not knowingly collect
                information from children under 16. If you believe a child has used the app, please
                contact us for prompt deletion of their data.
              </p>
            </div>

            <div className="privacy-section">
              <h2>Changes to This Policy</h2>
              <p>
                This Privacy Policy may be updated as Inigo evolves. When changes occur, we&apos;ll
                update the “Last Updated” date and, where appropriate, notify users in-app. Your
                continued use of Inigo means you accept the revised policy.
              </p>
            </div>

            <div className="privacy-section">
              <h2>Contact Us</h2>
              <p>If you have any questions about your privacy or data, please reach out:</p>
              <ul>
                <li>📩 <a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a></li>
                <li>
                  🌐 <Link href="https://inigo.now">https://inigo.now</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="privacy-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to join with confidence?</h2>
            <p>Your privacy is protected, your data is secure.</p>
            <div className="cta-buttons">
              <Link href="/#early-access" className="btn btn-primary btn-large">
                Join Early Access
              </Link>
              <Link href="/about" className="btn btn-ghost">
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
