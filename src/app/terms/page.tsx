import Link from 'next/link';

export default function Terms() {
  return (
    <>
      {/* Hero Section */}
      <section className="terms-hero">
        <div className="container">
          <div className="terms-hero-content">
            <h1>Terms and Conditions</h1>
            <p className="hero-subtitle">
              Please review these terms to understand how to use Inigo respectfully and safely.
            </p>
            <p className="terms-last-updated">
              <strong>Last updated:</strong> November 2025
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="terms-content">
        <div className="container">
          <div className="terms-introduction">
            <p>
              Welcome to Inigo, a social meditation network and mobile application developed and
              operated by Asaf Gadassi (&quot;Inigo&quot;, &quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your access to
              and use of the Inigo mobile app (the &quot;App&quot;) and the Inigo website available
              at <Link href="https://inigo.now">https://inigo.now</Link> (the &quot;Site&quot;). By
              using Inigo, you agree to these Terms. If you do not agree, please do not use the App
              or Site.
            </p>
          </div>

          <div className="terms-sections">
            <div className="terms-section">
              <h2>1. About Inigo</h2>
              <p>
                Inigo is an early-stage personal project created by Asaf Gadassi as a proof of
                concept for a social meditation network. Its purpose is to help people connect
                through quiet presence, mindfulness, and shared meditative experiences.
              </p>
              <p>Through Inigo, users can:</p>
              <ul>
                <li>Discover and share meditation spots and experiences</li>
                <li>Track personal meditation time</li>
                <li>Contribute to a collective world meditation counter</li>
                <li>Share reflections, photos, and moments of presence with others</li>
              </ul>
              <p>
                Inigo is currently running in a small testing volume, and features may evolve or
                change without notice.
              </p>
            </div>

            <div className="terms-section">
              <h2>2. Eligibility</h2>
              <p>To use Inigo, you must:</p>
              <ul>
                <li>Be at least 16 years old</li>
                <li>Have the legal capacity to agree to these Terms</li>
                <li>Use the App and Site in a respectful, lawful, and good-faith manner</li>
              </ul>
            </div>

            <div className="terms-section">
              <h2>3. Accounts and Authentication</h2>
              <p>
                You may create an account or sign in using Google or Apple authentication. By doing
                so, you agree to:
              </p>
              <ul>
                <li>Provide accurate and up-to-date information</li>
                <li>Keep your login credentials secure</li>
                <li>Accept responsibility for all actions taken under your account</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms or
                harm the community.
              </p>
            </div>

            <div className="terms-section">
              <h2>4. User Content</h2>
              <p>
                You may post reflections, photos, and experiences (&quot;User Content&quot;). By
                sharing such content, you grant Asaf Gadassi a non-exclusive, royalty-free, worldwide
                license to use, display, and distribute that content within Inigo to operate and
                improve the service.
              </p>
              <p>You are responsible for your User Content and agree that it will not:</p>
              <ul>
                <li>Violate any law or third-party rights</li>
                <li>Contain harmful, explicit, hateful, or misleading material</li>
                <li>Infringe on others&apos; privacy</li>
              </ul>
              <p>
                We may remove or restrict any content that violates these Terms or community values.
              </p>
            </div>

            <div className="terms-section">
              <h2>5. Community Guidelines</h2>
              <p>Inigo exists to cultivate quiet, kindness, and authentic connection. By participating, you agree to:</p>
              <ul>
                <li>Share only in a mindful and respectful way</li>
                <li>Avoid harassment, hate speech, or self-promotion</li>
                <li>Honor silence and simplicity — sometimes saying nothing is enough</li>
              </ul>
              <p>Users who act in ways that disrupt this environment may be suspended or removed.</p>
            </div>

            <div className="terms-section">
              <h2>6. Intellectual Property</h2>
              <p>
                All materials, designs, code, and content related to Inigo are created and owned by
                Asaf Gadassi. You may not copy, modify, or redistribute any part of Inigo without
                written permission.
              </p>
            </div>

            <div className="terms-section">
              <h2>7. Privacy</h2>
              <p>
                Your privacy is important. Inigo uses secure third-party tools such as Firebase (for
                authentication and storage) and Django (for backend operations). No data is sold or
                shared with external parties. Please review our{' '}
                <Link href="/privacy">Privacy Policy</Link> for details on how information is
                collected, stored, and used.
              </p>
            </div>

            <div className="terms-section">
              <h2>8. Experimental Nature</h2>
              <p>Inigo is an evolving prototype. You acknowledge that:</p>
              <ul>
                <li>Features may be incomplete or temporarily unavailable</li>
                <li>Data or accounts may be reset during testing</li>
                <li>The experience may change as development continues</li>
              </ul>
            </div>

            <div className="terms-section">
              <h2>9. Disclaimer</h2>
              <p>
                Inigo is not a medical or therapeutic service. It is a community space for personal
                reflection and shared meditation. Use the App and Site at your own discretion and
                consult a professional for medical or psychological concerns.
              </p>
            </div>

            <div className="terms-section">
              <h2>10. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Asaf Gadassi shall not be liable for any
                indirect, incidental, or consequential damages arising from your use or inability to
                use Inigo.
              </p>
            </div>

            <div className="terms-section">
              <h2>11. Termination</h2>
              <p>
                You may stop using Inigo at any time. We may suspend or delete accounts that violate
                these Terms, disrupt others&apos; experiences, or threaten the integrity of the
                platform.
              </p>
            </div>

            <div className="terms-section">
              <h2>12. Changes to Terms</h2>
              <p>
                These Terms may be updated as Inigo grows. When changes are made, the updated version
                will be published at <Link href="https://inigo.now/terms">https://inigo.now/terms</Link>.
                Your continued use of Inigo after changes take effect means you accept the revised
                Terms.
              </p>
            </div>

            <div className="terms-section">
              <h2>13. Contact</h2>
              <p>If you have any questions, feedback, or concerns, please contact:</p>
              <ul>
                <li>
                  Email: <a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a>
                </li>
                <li>
                  Website: <Link href="https://inigo.now">https://inigo.now</Link>
                </li>
              </ul>
            </div>

            <div className="terms-section">
              <h2>14. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Israel,
                without regard to conflict of law principles.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

