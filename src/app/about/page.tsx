import Link from 'next/link';

export default function About() {
  return (
    <>
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <h1>About Us</h1>
            <p className="hero-subtitle">The quiet revolution starts here — together.</p>
          </div>
        </div>
      </section>

      {/* Why Inigo Section */}
      <section className="why-inigo-section">
        <div className="container">
          <div className="section-content">
            <div className="section-header">
              <h2>✨ Why Inigo</h2>
            </div>
            <div className="story-content">
              <p className="story-problem">
                We&apos;ve all felt it — the weight, the noise, the restlessness of life.
                <br />
                Moments when calm feels far away.
              </p>
              <p className="story-solution">
                So we search for a way out, a way back to ourselves.
              </p>
              <p className="story-core">
                Inigo was born from that search.
                Because we&apos;ve also touched the other side — the quiet, the presence, the softest love that creates without effort.
                And we know how good it is.
              </p>
              <p className="story-closing">
                Life isn&apos;t always calm, but together we can return to that place, again and again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Meditation Section */}
      <section className="why-meditation-section">
        <div className="container">
          <div className="section-content">
            <div className="section-header">
              <h2>🌱 Why Meditation</h2>
            </div>
            <div className="meditation-content">
              <p className="meditation-intro">
                Meditation is the most natural way to clear the mind and open the heart.
                It is not about control or perfection.
              </p>
              <p className="meditation-core">
                It is about release — gently letting go of the weight we carry — and in that openness, connecting more deeply than ever before.
              </p>
              <div className="meditation-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">🧠</span>
                  <span>Senses sharpen</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🎯</span>
                  <span>Action becomes clear</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✨</span>
                  <span>Presence fills the moment</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔋</span>
                  <span>Recharges us</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🌿</span>
                  <span>Softens the nervous system</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">😊</span>
                  <span>Brings joy back into everyday life</span>
                </div>
              </div>
              <p className="meditation-closing">
                Meditation recharges us, softens the nervous system, and brings joy back into everyday life, even alongside responsibilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Together Section */}
      <section className="why-together-section">
        <div className="container">
          <div className="section-content">
            <div className="section-header">
              <h2>🤝 Why Together</h2>
            </div>
            <div className="together-content">
              <p className="together-problem">
                We know how hard it is to sustain meditation when it&apos;s only for ourselves.
                That&apos;s why habits break, why practice slips away.
              </p>
              <div className="together-transformation">
                <h3>Together, it&apos;s different.</h3>
                <p>
                  When we meditate as one, we help each other recognize it, feel it, embrace it.
                  Meditation stops being a lonely habit — and becomes the most natural, joyful, even ecstatic thing you&apos;ll want to return to again and again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collective World State Section */}
      <section className="collective-world-state-section">
        <div className="container">
          <div className="section-content">
            <div className="section-header">
              <h2>🌍 The Collective World State</h2>
              <p className="section-subtitle">
                ✨ From inner to beyond. From personal to collective. From moments… to world-changing. ✨
              </p>
            </div>
            <div className="collective-content">
              <p className="collective-intro">
                Every meditation you take is not just yours.
                It flows into the collective world state — a living score of calm and clarity that grows with every breath, every pause, every reflection.
              </p>
              <p className="collective-vision">
                Here, meditation is a shared journey:
              </p>
              <div className="collective-features">
                <div className="feature-item">
                  <span className="feature-icon">🌍</span>
                  <span>Discover new places</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💫</span>
                  <span>Share your reflections</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">❤️</span>
                  <span>Belong to a real community</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌱</span>
                  <span>Lift the frequency of the world, one session at a time</span>
                </div>
              </div>
              <div className="collective-closing">
                <p>
                  Inigo is a safe space to step fully into the moment, to open, and to remember what is real.
                  Meditation here is not escape — it is return.
                </p>
                <p className="revolution-call">
                  A quiet revolution, beginning together.
                </p>
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
