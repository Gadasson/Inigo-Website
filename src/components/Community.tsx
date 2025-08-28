import siteContent from '../../content/site.json';

export default function Community() {
  return (
    <section className="community-section">
      <div className="container">
        <div className="section-header">
          <h2>{siteContent.community.miniHeadline}</h2>
          <p>{siteContent.community.copy}</p>
        </div>
        
        <div className="community-pillars">
          {siteContent.community.pillars.map((pillar, index) => (
            <div key={index} className="pillar-item">
              <div className="pillar-icon">{pillar.icon}</div>
              <h3>{pillar.title}</h3>
            </div>
          ))}
        </div>
        
        <div className="section-cta">
          <a href="#early-access" className="btn btn-primary">
            {siteContent.community.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
