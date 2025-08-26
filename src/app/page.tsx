'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [duplicateEmail, setDuplicateEmail] = useState(false);

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

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if still in cooldown
    if (cooldown > 0) {
      return;
    }
    
    setIsSubmitting(true);
    setDuplicateEmail(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      source: formData.get('source'),
      device: formData.get('device'),
      motivation: formData.get('motivation'),
      readiness: formData.get('readiness'),
      timestamp: new Date().toISOString()
    };

    try {
      // Try to submit with CORS first to get proper response
      let response;
      try {
        response = await fetch('https://script.google.com/macros/s/AKfycbw4349nDx2iTAjEp0UqqaEuKmx5m8vgJrdZ0yKfF7bzEp6ChbaUIohLBitmiOn7q_h4/exec', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const result = await response.text();
          
          // Check if it's a duplicate email response
          if (result.includes('Email already exists')) {
            setDuplicateEmail(true);
            return;
          }
          
          // Success
          setIsSubmitted(true);
          if (form) {
            form.reset();
          }
          setCooldown(300);
          return;
        }
      } catch (corsError) {
        console.log('CORS failed, trying no-cors mode');
      }
      
      // Fallback to no-cors mode
      const formDataForGoogle = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formDataForGoogle.append(key, value as string);
      });

      await fetch('https://script.google.com/macros/s/AKfycbw4349nDx2iTAjEp0UqqaEuKmx5m8vgJrdZ0yKfF7bzEp6ChbaUIohLBitmiOn7q_h4/exec', {
        method: 'POST',
        body: formDataForGoogle,
        mode: 'no-cors'
      });
      
      // Assume success in no-cors mode
      setIsSubmitted(true);
      if (form) {
        form.reset();
      }
      setCooldown(300);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            <a className="btn btn-primary" href="#early-access">Join the Frequency</a>
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
              <img loading="lazy" src="/images/plastic-burnout-compressed.jpg" alt="Cold neon city and anonymous crowd" />
              <img loading="lazy" src="/images/plastic-moments-compressed.jpg" alt="Hand scrolling phone in the dark" />
            </div>
          </div>
          <div className="card">
            <span className="tag tag-ecstatic">Ecstatic</span>
            <h3>Arriving in the moment</h3>
            <p>Real joy, real presence. Feeling your body, breath, and heart again. Connection without masks. Small moments that explode with beauty.</p>
            <div className="grid-2">
              <img loading="lazy" src="/images/ecstatic-friends-compressed.jpg" alt="Family laughing in golden sunlight" />
              <img loading="lazy" src="/images/ecstatic-mom-compressed.jpg" alt="Person breathing in nature at sunrise" />
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR: faces grid */}
      <section className="audience">
        <h2>Who It Speaks To</h2>
        <p>Burnt‑out dreamers. Sensitive souls in a loud world. Creatives, seekers, lovers. Young people tired of scrolling and ready to feel.</p>
        <div className="faces">
          <img loading="lazy" src="/images/face1-compressed.jpg" alt="Smiling person in nature" />
          <img loading="lazy" src="/images/face2-compressed.jpg" alt="Group of friends hugging" />
          <img loading="lazy" src="/images/face3-compressed.jpg" alt="Mountains and sky" />
          <img loading="lazy" src="/images/face4-compressed.jpg" alt="Person meditating at sunset" />
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
            <a className="btn btn-primary" href="#early-access">Join the First 30</a>
            <a className="btn btn-ghost" href="#manifesto">Read the Manifesto</a>
          </div>
        </section>

      {/* BECOME ONE OF THE FIRST 30 */}
      <section id="early-access" className="early-access">
        <div className="early-access-inner">
          <div className="early-access-header">
            <div className="early-access-icon">🌱</div>
            <h2>Join the First 30</h2>
            <p className="early-access-subtitle">The quiet revolution is brewing. We&apos;re crafting something that will change everything.</p>
          </div>
          
          <div className="early-access-features">
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
          
          <p className="early-access-cta">Join the waitlist and be the first to experience the shift from plastic to ecstatic.</p>
          
          <div className="early-access-form">
            <form onSubmit={handleFormSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input type="text" id="name" name="name" required placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input type="email" id="email" name="email" required placeholder="your.email@example.com" />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="source">How did you discover Inigo? *</label>
                  <select id="source" name="source" required>
                    <option value="">Select an option</option>
                    <option value="social-media">Social Media</option>
                    <option value="friend">Friend/Family Recommendation</option>
                    <option value="search">Search Engine</option>
                    <option value="article">Article/Blog Post</option>
                    <option value="podcast">Podcast</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="device">Primary Device *</label>
                  <select id="device" name="device" required>
                    <option value="">Select your device</option>
                    <option value="iphone">iPhone</option>
                    <option value="android">Android</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="motivation">What motivates you most about joining this community? *</label>
                <select id="motivation" name="motivation" required>
                  <option value="">Select what resonates with you</option>
                  <option value="connection">Finding real human connection</option>
                  <option value="mindfulness">Living more mindfully</option>
                  <option value="change">Being part of positive change</option>
                  <option value="growth">Personal and spiritual growth</option>
                  <option value="community">Building meaningful community</option>
                  <option value="purpose">Finding deeper purpose</option>
                </select>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="readiness">How ready do you feel to be a founding member? *</label>
                <select id="readiness" name="readiness" required>
                  <option value="">Select your readiness level</option>
                  <option value="very-ready">Very ready - I&apos;m all in!</option>
                  <option value="ready">Ready - I&apos;m excited to start</option>
                  <option value="curious">Curious - I want to learn more</option>
                  <option value="exploring">Exploring - I&apos;m open to possibilities</option>
                </select>
              </div>
              
                              <div className="form-actions">
                  {/* Cooldown Message */}
                  {cooldown > 0 && (
                    <div className="cooldown-message">
                      <div className="cooldown-icon">⏰</div>
                      <p>Please wait before submitting another application</p>
                      <div className="cooldown-timer">
                        <span>Next submission available in:</span>
                        <span className="timer">{Math.floor(cooldown / 60)}:{(cooldown % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-large" 
                    disabled={isSubmitting || cooldown > 0}
                  >
                    {isSubmitting ? 'Joining...' : cooldown > 0 ? 'Submission Cooldown' : 'Join the Revolution'}
                  </button>
                  
                  {/* Default Note */}
                  {!isSubmitted && !duplicateEmail && cooldown === 0 && (
                    <p className="form-note">* Only 30 founding spots available. We&apos;ll get back to you soon!</p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <p>Inigo — Plastic to Ecstatic · Quiet is the new power · Stillness is our protest</p>
          <p>#PlasticToEcstatic · #StillTogether · #InigoMoments</p>
        </footer>

        {/* SUCCESS/DUPLICATE MODAL */}
        {(isSubmitted || duplicateEmail) && (
          <div className="modal-overlay" onClick={() => {
            setIsSubmitted(false);
            setDuplicateEmail(false);
          }}>
            <div className="modal-content form-result-modal" onClick={(e) => e.stopPropagation()}>
              {/* Success Modal */}
              {isSubmitted && (
                <>
                  <div className="modal-header">
                    <div className="modal-icon success">🎉</div>
                    <h3>Application Submitted!</h3>
                  </div>
                  <div className="modal-body">
                    <p>Thank you for applying to join the First 30. We&apos;ll review your application and get back to you soon.</p>
                    <div className="modal-features">
                      <div className="feature-item">
                        <span className="feature-icon">📋</span>
                        <span>Your application has been received</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">⏰</span>
                        <span>We&apos;ll contact you soon</span>
                      </div>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary" onClick={() => setIsSubmitted(false)}>
                      Got It!
                    </button>
                  </div>
                </>
              )}

              {/* Duplicate Email Modal */}
              {duplicateEmail && (
                <>
                  <div className="modal-header">
                    <div className="modal-icon duplicate">⚠️</div>
                    <h3>Already Applied</h3>
                  </div>
                  <div className="modal-body">
                    <p>We found an existing application with this email address. You can only submit one application per email.</p>
                    <div className="modal-features">
                      <div className="feature-item">
                        <span className="feature-icon">📋</span>
                        <span>Your original application is on file</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">🔄</span>
                        <span>If you need to update your application, please contact us</span>
                      </div>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary" onClick={() => setDuplicateEmail(false)}>
                      Understood
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}


    </>
  );
}
