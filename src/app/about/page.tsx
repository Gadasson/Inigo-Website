import Link from 'next/link';

export default function About() {
  return (
    <>
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <h1>About Inigo</h1>
            <p className="hero-subtitle">The quiet revolution starts here — together.</p>
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="about-manifesto">
        <div className="container">
          <div className="manifesto-content">
            <div className="manifesto-header">
              <h2>✨ From inner to beyond. From personal to collective. From moments… to world-changing. ✨</h2>
            </div>
            
            <div className="manifesto-body">
                              <p>Every time you meditate, your presence adds to something bigger: a collective world state score that grows with each breath, each pause, each reflection.</p>
                
                <p>Here, meditation isn&apos;t just yours — it&apos;s ours.</p>
              
              <div className="manifesto-features">
                <div className="feature-item">
                  <span className="feature-icon">🌍</span>
                  <span>Discover new places.</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💫</span>
                  <span>Share your reflections.</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">❤️</span>
                  <span>Belong to a real community.</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌱</span>
                  <span>Lift the frequency of the world, one session at a time.</span>
                </div>
              </div>
              
                              <p>Step through the doorway into calm, connection, and possibility.</p>
                
                <p className="manifesto-closing">It&apos;s safe. It&apos;s exciting. And it&apos;s real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>We&apos;re building a world where meditation isn&apos;t just a personal practice — it&apos;s a collective force for change. Every session you complete, every moment of stillness you share, contributes to a global frequency of calm and presence.</p>
            
            <div className="mission-stats">
              <div className="stat-item">
                <div className="stat-number">1</div>
                <div className="stat-label">Collective World State</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">∞</div>
                <div className="stat-label">Possibilities</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">❤️</div>
                <div className="stat-label">Real Community</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to join the quiet revolution?</h2>
            <p>Be part of something bigger than yourself.</p>
            <div className="cta-buttons">
              <Link href="/#early-access" className="btn btn-primary btn-large">
                Join Early Access
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
