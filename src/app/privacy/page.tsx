import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      {/* Hero Section */}
      <section className="privacy-hero">
        <div className="container">
          <div className="privacy-hero-content">
            <h1>Privacy Policy</h1>
            <p>Your privacy matters to us. Here's how we protect your data.</p>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="privacy-content">
        <div className="container">
          <div className="privacy-sections">
            <div className="privacy-section">
              <h2>Data Collection</h2>
              <p>We collect only the information necessary to provide you with the best meditation experience:</p>
              <ul>
                <li><strong>Email address</strong> - for account creation and communication</li>
                <li><strong>Device information</strong> - to optimize your experience</li>
                <li><strong>Meditation sessions</strong> - to contribute to our collective world state</li>
                <li><strong>Optional reflections</strong> - only if you choose to share</li>
              </ul>
            </div>

            <div className="privacy-section">
              <h2>How We Use Your Data</h2>
              <p>Your information helps us:</p>
              <ul>
                <li>Create and maintain your account</li>
                <li>Provide personalized meditation experiences</li>
                <li>Contribute to our collective world state score</li>
                <li>Improve our services based on community feedback</li>
                <li>Send important updates about Inigo</li>
              </ul>
            </div>

            <div className="privacy-section">
              <h2>Data Protection</h2>
              <p>We take your privacy seriously:</p>
              <ul>
                <li>All data is encrypted in transit and at rest</li>
                <li>We never sell your personal information</li>
                <li>Your meditation sessions are aggregated anonymously</li>
                <li>Sharing is always optional and controlled by you</li>
                <li>We comply with GDPR and other privacy regulations</li>
              </ul>
            </div>

            <div className="privacy-section">
              <h2>Your Rights</h2>
              <p>You have complete control over your data:</p>
              <ul>
                <li>Access and review your personal information</li>
                <li>Update or correct your data at any time</li>
                <li>Delete your account and all associated data</li>
                <li>Opt out of communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </div>

            <div className="privacy-section">
              <h2>Contact Us</h2>
              <p>If you have any questions about your privacy or data, please don't hesitate to reach out:</p>
              <div className="contact-info">
                <p><strong>Email:</strong> <a href="mailto:privacy@inigo.now">privacy@inigo.now</a></p>
                <p><strong>Contact Page:</strong> <Link href="/contact">Get in Touch</Link></p>
              </div>
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
