import siteContent from '../../content/site.json';

export default function WorldState() {
  return (
    <section id="how-it-works" className="world-state-section">
      <div className="container">
        <div className="section-header">
          <h2>{siteContent.worldState.miniHeadline}</h2>
          <p>{siteContent.worldState.copy}</p>
        </div>
        
        <div className="world-state-features">
          {siteContent.worldState.bullets.map((bullet, index) => (
            <div key={index} className="feature-item">
              <div className="feature-icon">✨</div>
              <span>{bullet}</span>
            </div>
          ))}
        </div>
        
        <div className="section-cta">
          <button className="btn btn-secondary">
            {siteContent.worldState.cta}
          </button>
        </div>
      </div>
    </section>
  );
}
