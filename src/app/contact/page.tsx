import Link from 'next/link';
import ContactForm from '../../components/ContactForm';

export default function Contact() {

  return (
    <>
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <h1>Get in Touch</h1>
            <p>Have questions? Want to collaborate? We&apos;d love to hear from you.</p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>Send us a message</h2>
              <p>We&apos;ll get back to you within 24 hours.</p>
              
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div className="contact-info-section">
              <h2>Other ways to reach us</h2>
              
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📧</div>
                  <div className="method-content">
                    <h3>Email</h3>
                    <p><a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a></p>
                    <p>For general inquiries and support</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">🔒</div>
                  <div className="method-content">
                    <h3>Privacy</h3>
                    <p><a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a></p>
                    <p>For privacy and data-related questions</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">🌍</div>
                  <div className="method-content">
                    <h3>Social</h3>
                    <p>Follow us for updates and community</p>
                    <p>Links coming soon...</p>
                  </div>
                </div>
              </div>

              <div className="contact-note">
                <h3>Response Time</h3>
                <p>We typically respond within 24 hours during business days. For urgent matters, please include &ldquo;URGENT&rdquo; in your subject line.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="contact-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to join the quiet revolution?</h2>
            <p>While you&apos;re here, why not sign up for early access?</p>
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
