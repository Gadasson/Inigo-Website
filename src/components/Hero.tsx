'use client';

import { useEffect, useState } from 'react';
import siteContent from '../../content/site.json';

export default function Hero() {
  const [worldStateCount, setWorldStateCount] = useState(247);

  useEffect(() => {
    // Animate world state counter to show growth
    const interval = setInterval(() => {
      setWorldStateCount(prev => {
        const newCount = prev + Math.floor(Math.random() * 3) + 1;
        // Cap at 500 to prevent unlimited growth
        return newCount > 500 ? 500 : newCount;
      });
    }, 15000 + Math.random() * 15000); // Random interval between 15-30 seconds

    return () => clearInterval(interval);
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
            className="btn btn-ghost" 
            href="/about"
            data-event="hero_about_clicked"
          >
            About Us
          </a>
          <a 
            className="btn btn-ghost" 
            href="#how-it-works"
            data-event="hero_cta_clicked"
          >
            {siteContent.hero.secondaryCta}
          </a>
          <a 
            className="btn btn-primary" 
            href="#early-access"
            data-event="hero_cta_clicked"
          >
            {siteContent.hero.primaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}
