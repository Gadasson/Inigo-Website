'use client';

import { useEffect, useState } from 'react';
import siteContent from '../../content/site.json';

export default function Hero() {
  const [worldStateCount, setWorldStateCount] = useState(0);

  useEffect(() => {
    // Animate world state counter on mount
    const timer = setTimeout(() => {
      setWorldStateCount(prev => prev + 1);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="hero">
      <div className="hero-inner">
        <span className="badge">Quiet is the new revolution</span>
        
        <h1>{siteContent.hero.headline}</h1>
        
        <p>{siteContent.hero.subhead}</p>
        
        {/* World State Counter */}
        <div className="world-state-counter">
          <div className="counter-display">
            <div className="counter-circle">
              <span className="counter-number">{worldStateCount.toLocaleString()}</span>
            </div>
            <span className="counter-label">collective minutes of calm</span>
          </div>
        </div>
        
        <div className="cta-buttons">
          <a 
            className="btn btn-primary" 
            href="#early-access"
            data-event="hero_cta_clicked"
          >
            {siteContent.hero.primaryCta}
          </a>
          <a 
            className="btn btn-ghost" 
            href="#how-it-works"
            data-event="hero_cta_clicked"
          >
            {siteContent.hero.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}
