'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Interactive progress bar functionality
    const mins = document.getElementById('mins');
    const active = document.getElementById('active');
    const pct = document.getElementById('pct');
    const fill = document.getElementById('fill');
    
    if (mins && active && pct && fill) {
      let minutes = 3472, people = 147, percent = 64;
      
      const interval = setInterval(() => {
        minutes += Math.floor(Math.random() * 5);
        people += Math.random() > .5 ? 1 : -1;
        percent = Math.min(99, percent + (Math.random() > .7 ? 1 : 0));
        
        mins.textContent = minutes.toLocaleString();
        active.textContent = Math.max(0, people).toString();
        pct.textContent = percent + '%';
        fill.style.width = percent + '%';
      }, 2500);

      return () => clearInterval(interval);
    }
  }, []);

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <span className="badge">Quiet is the new revolution</span>
          <h1>Inigo — <em>Plastic to Ecstatic</em></h1>
          <p>From fake to real. From numb to now. From plastic… to ecstatic. The quiet revolution starts here — together.</p>
          <div className="cta-buttons">
            <a className="btn btn-primary" href="#download">Join the Frequency</a>
            <a className="btn btn-ghost" href="#manifesto">Read the Manifesto</a>
          </div>
        </div>
      </section>

      {/* MEANING: Plastic → Ecstatic (with images) */}
      <section className="meaning">
        <h2>What Does &ldquo;Plastic to Ecstatic&rdquo; Mean?</h2>
        <div className="split">
          <div className="card">
            <span className="tag tag-plastic">Plastic</span>
            <h3>Performing instead of feeling</h3>
            <p>Fake smiles, scroll addiction, superficial connection, burnout, numbness, auto‑pilot, loneliness in a world full of noise.</p>
            <div className="grid-2">
              <img loading="lazy" src="/images/plastic-burnout.jpg" alt="Cold neon city and anonymous crowd" />
              <img loading="lazy" src="/images/plastic-moments.jpg" alt="Hand scrolling phone in the dark" />
            </div>
          </div>
          <div className="card">
            <span className="tag tag-ecstatic">Ecstatic</span>
            <h3>Arriving in the moment</h3>
            <p>Real joy, real presence. Feeling your body, breath, and heart again. Connection without masks. Small moments that explode with beauty.</p>
            <div className="grid-2">
              <img loading="lazy" src="/images/ecstatic-family.jpg" alt="Family laughing in golden sunlight" />
              <img loading="lazy" src="/images/ecstatic-mom.jpg" alt="Person breathing in nature at sunrise" />
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR: faces grid */}
      <section className="audience">
        <h2>Who It Speaks To</h2>
        <p>Burnt‑out dreamers. Sensitive souls in a loud world. Creatives, seekers, lovers. Young people tired of scrolling and ready to feel.</p>
        <div className="faces">
          <img loading="lazy" src="/images/face1.jpg" alt="Smiling person in nature" />
          <img loading="lazy" src="/images/face2.jpg" alt="Group of friends hugging" />
          <img loading="lazy" src="/images/face3.jpg" alt="Mountains and sky" />
          <img loading="lazy" src="/images/face4.jpg" alt="Person meditating at sunset" />
        </div>
      </section>

      {/* MANIFESTO full-bleed */}
      <section id="manifesto" className="manifesto">
        <div className="inner">
          <h2>Mini‑Manifesto: Plastic to Ecstatic</h2>
          <p>We live in a world of filters and fake smiles. A world where everything is fast, loud, and always online. But deep inside, we all know it — something real is missing.</p>
          <p>At Inigo, we believe the way back isn&apos;t forward — it&apos;s inward. Close your eyes. Breathe. Feel your body again. See the sky again. Remember what&apos;s real again.</p>
          <p>We&apos;re not here to escape life — we&apos;re here to enter it fully. It starts in stillness. It spreads in connection. It ends in joy. From plastic… to ecstatic. Together.</p>
        </div>
      </section>

      {/* PROGRESS / WORLD STATE */}
      <section className="world-state">
        <h2>Our Collective Pulse</h2>
        <p>Every meditation slows the world. This is where we are right now:</p>
        <div className="progress-wrap">
          <div className="bar">
            <div className="fill" id="fill"></div>
          </div>
          <div className="progress-meta">
            <span>Today: <strong id="mins">3,472</strong> minutes</span>
            <span>Active now: <strong id="active">147</strong></span>
            <span>To Magic Number: <strong id="pct">64%</strong></span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Be Part of the Movement</h2>
        <p>Not another app. A new world. Meditate socially. Live deeply. Feel again.</p>
        <div className="cta-buttons">
          <button className="btn btn-primary" id="download" onClick={handleDownloadClick}>Download Inigo</button>
          <a className="btn btn-ghost" href="#">Explore More</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>Inigo — Plastic to Ecstatic · Quiet is the new power · Stillness is our protest</p>
        <p>#PlasticToEcstatic · #StillTogether · #InigoMoments</p>
      </footer>

      {/* COMING SOON MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            
            <div className="modal-header">
              <div className="modal-icon">🌱</div>
              <h3>Coming Soon</h3>
            </div>
            
            <div className="modal-body">
              <p className="modal-message">
                The quiet revolution is brewing. We&apos;re crafting something that will change everything.
              </p>
              
              <div className="modal-features">
                <div className="feature-item">
                  <span className="feature-icon">🧘‍♀️</span>
                  <span>Social meditation</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌿</span>
                  <span>Nature connection</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💫</span>
                  <span>Ecstatic moments</span>
                </div>
              </div>
              
              <p className="modal-cta">
                Join the waitlist and be the first to experience the shift from plastic to ecstatic.
              </p>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={closeModal}>
                I&apos;ll Wait Patiently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
