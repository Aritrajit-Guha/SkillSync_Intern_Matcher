const FEATURED_IDS = [
  'amazon-swe-remote',
  'openx-fullstack-jaipur',
  'technova-ml-coimbatore',
];

export default function HomePage({ internships, trackLabels, onEnter, onScroll, onOpen }) {
  const featured = FEATURED_IDS
    .map(id => internships.find(item => item.id === id))
    .filter(Boolean);

  return (
    <>
      <section className="hero-section" id="home-top">
        <div className="hero-grid hero-grid-clean">
          <div className="hero-copy hero-copy-clean">
            <span className="hero-pill">PM Internship Scheme</span>
            <h1>Find internships that match your skills and show a clear path to apply.</h1>
            <p>Create your candidate profile, review role-fit instantly, and unlock non-eligible roles through guided upskilling.</p>
            <div className="hero-actions">
              <button className="btn-hero-primary" onClick={onEnter} type="button">Create Candidate Profile</button>
              <button className="btn-hero-secondary" onClick={() => onScroll('featured-opportunities')} type="button">Browse Opportunities</button>
            </div>
            <div className="hero-trust-row">
              <div className="hero-trust-pill">
                <strong>{internships.length}</strong>
                <span>updated openings</span>
              </div>
              <div className="hero-trust-pill">
                <strong>3-5</strong>
                <span>best-fit roles shown</span>
              </div>
              <div className="hero-trust-pill">
                <strong>AI</strong>
                <span>roadmap guidance</span>
              </div>
            </div>
          </div>

          <div className="hero-spotlight hero-spotlight-clean">
            <div className="hero-preview-card">
              <div className="preview-topline">
                <span className="preview-dot" />
                <span>Candidate journey preview</span>
              </div>
              {[
                ['01', 'Profile creation', 'Capture education, location, and real skills before matching.'],
                ['02', 'Best-fit internship shortlist', 'See the strongest 3 to 5 roles based on skills, location, and education.'],
                ['03', 'AI roadmap and apply flow', 'Unlock skill-gap roles, then submit resume, CGPA, and candidate details.'],
              ].map(([num, title, text]) => (
                <div className="preview-stage" key={num}>
                  <span className="preview-stage-num">{num}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
              <div className="preview-glow" />
            </div>
          </div>
        </div>
      </section>

      <section className="stats-band">
        <div className="stats-band-inner">
          <div className="stats-item"><strong>{internships.length}</strong><span>updated internship records</span></div>
          <div className="stats-item"><strong>28+</strong><span>skill signals used for matching</span></div>
          <div className="stats-item"><strong>1 workflow</strong><span>profile, roadmap, progress, and apply tracking</span></div>
        </div>
      </section>

      <section className="content-section" id="featured-opportunities">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">Featured roles</span>
            <h2>Fresh opportunities across software, data, cloud, and mobile.</h2>
          </div>
        </div>
        <div className="featured-grid">
          {featured.map(item => (
            <article className="feature-card feature-card-clean" key={item.id}>
              <div className="feature-card-top">
                <span className="feature-icon">{item.icon}</span>
                <span className="feature-chip">{trackLabels[item.sector] || item.sector}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.org} · {item.location}</p>
              <div className="feature-meta">
                <span>{item.jobType}</span>
                <span>{item.stipend}</span>
              </div>
              <button className="feature-cta" onClick={() => onOpen(item.id)} type="button">Open Internship</button>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section about-section" id="about-us">
        <div className="about-panel about-panel-clean">
          <div>
            <span className="eyebrow">About us</span>
            <h2>A more practical internship journey for candidates.</h2>
          </div>
          <p>This portal is designed to reduce confusion during internship search. Instead of only showing matches, it explains why a role fits, what is missing, and how to unlock better opportunities through a structured roadmap.</p>
        </div>
      </section>

      <section className="content-section contact-section" id="contact-us">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">Contact us</span>
            <h2>Need help with your profile or roadmap?</h2>
          </div>
        </div>
        <div className="contact-grid">
          <article className="contact-card"><h3>Candidate Support</h3><p>support@pminternshipscheme.in</p><p>+91 1800-120-2024</p></article>
          <article className="contact-card"><h3>Hours</h3><p>Monday to Friday</p><p>9:00 AM to 6:00 PM IST</p></article>
          <article className="contact-card"><h3>Next step</h3><p>Create a candidate profile to unlock internship search and roadmap tracking.</p></article>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <h3>PM Internship Scheme</h3>
            <p>Professional internship discovery with skill-gap roadmaps and progress tracking.</p>
          </div>
          <div className="footer-links">
            <button onClick={() => onScroll('home-top')} type="button">Home</button>
            <button onClick={() => onScroll('about-us')} type="button">About Us</button>
            <button onClick={() => onScroll('contact-us')} type="button">Contact Us</button>
            <button onClick={onEnter} type="button">Candidate Profile</button>
          </div>
        </div>
      </footer>
    </>
  );
}
