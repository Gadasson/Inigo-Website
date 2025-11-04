'use client';

import siteContent from '../../content/site.json';
import { useWorldStateContext } from '../contexts/WorldStateContext';

export default function Hero() {
  const { worldState, loading } = useWorldStateContext();
  
  // Get current minutes from API or use fallback
  // Fallback to 0 if no data available (prevents errors)
  const currentMinutes = worldState?.state_info?.current_minutes ?? 0;

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
              {loading && (
                <div className="counter-skeleton"></div>
              )}
              {!loading && (
                <span className="counter-number">
                  {currentMinutes.toLocaleString()}
                </span>
              )}
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
            className="btn btn-primary" 
            href="#early-access"
            data-event="hero_cta_clicked"
          >
            {siteContent.hero.primaryCta}
          </a>
          <a 
            className="btn btn-ghost" 
            href="/contact?subject=Guided%20meditations%20for%20Inigo&message=Hi%20Inigo%20Team%2C%0A%0AI%E2%80%99m%20a%20meditation%20guide%20and%20I%E2%80%99d%20love%20to%20share%20guided%20meditations%20to%20support%20the%20quiet%20revolution.%0A%0AHere%E2%80%99s%20a%20bit%20about%20me%20and%20what%20I%20can%20offer%3A%0A-%20Style%2FTradition%3A%20%0A-%20Experience%3A%20%0A-%20Sample%20links%3A%20%0A-%20How%20I%E2%80%99d%20like%20to%20contribute%3A%20%0A%0AThank%20you!%0A"
            data-event="hero_cta_clicked"
          >
            Meditation guide? Join us
          </a>
        </div>
      </div>
    </section>
  );
}
