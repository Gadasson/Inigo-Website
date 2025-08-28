import siteContent from '../../content/site.json';

export default function EarlyAdopters() {
  return (
    <section className="early-adopters-section">
      <div className="container">
        <div className="section-header">
          <h2>{siteContent.earlyAdopters.miniHeadline}</h2>
        </div>
        
        <div className="benefits-list">
          {siteContent.earlyAdopters.bullets.map((benefit, index) => (
            <div key={index} className="benefit-item">
              <div className="benefit-icon">🌟</div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
        
        <div className="section-cta">
          <a href="#early-access" className="btn btn-primary btn-large">
            {siteContent.earlyAdopters.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
