import siteContent from '../../content/site.json';

export default function DiscoverReflect() {
  return (
    <section className="discover-reflect-section">
      <div className="container">
        <div className="section-header">
          <h2>{siteContent.discoverReflect.miniHeadline}</h2>
          <p>{siteContent.discoverReflect.copy}</p>
        </div>
        
        <div className="discover-features">
          {siteContent.discoverReflect.bullets.map((bullet, index) => (
            <div key={index} className="feature-item">
              <div className="feature-icon">🌿</div>
              <span>{bullet}</span>
            </div>
          ))}
        </div>
        
        <div className="spots-preview">
          <div className="spot-card">
            <div className="spot-image">🌳</div>
            <h3>Central Park</h3>
            <p>Quiet corner near the lake</p>
          </div>
          <div className="spot-card">
            <div className="spot-image">🏔️</div>
            <h3>Mountain Trail</h3>
            <p>Sunrise meditation spot</p>
          </div>
          <div className="spot-card">
            <div className="spot-image">🏛️</div>
            <h3>City Garden</h3>
            <p>Urban oasis for reflection</p>
          </div>
        </div>
        
        <div className="section-cta">
          <a href="#early-access" className="btn btn-secondary">
            {siteContent.discoverReflect.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
