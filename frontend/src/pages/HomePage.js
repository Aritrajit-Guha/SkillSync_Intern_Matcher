/**
 * HomePage - Cleaner, more professional landing page.
 */
const HomePage = {
  FEATURED_IDS: [
    'amazon-swe-remote',
    'openx-fullstack-jaipur',
    'technova-ml-coimbatore'
  ],

  render(state) {
    const root = document.getElementById('home-view');
    if (!root) return;

    const featured = this.FEATURED_IDS
      .map(id => STATIC_INTERNSHIPS.find(item => item.id === id))
      .filter(Boolean);

    root.innerHTML = `
      <section class="hero-section" id="home-top">
        <div class="hero-grid hero-grid-clean">
          <div class="hero-copy hero-copy-clean">
            <span class="hero-pill">PM Internship Scheme</span>
            <h1>Find internships that match your skills and show a clear path to apply.</h1>
            <p>Create your candidate profile, review role-fit instantly, and unlock non-eligible roles through guided upskilling.</p>
            <div class="hero-actions">
              <button class="btn-hero-primary" onclick="App.enterCandidateFlow()">Create Candidate Profile</button>
              <button class="btn-hero-secondary" onclick="App.scrollToHomeSection('featured-opportunities')">Browse Opportunities</button>
            </div>
            <div class="hero-trust-row">
              <div class="hero-trust-pill">
                <strong>${STATIC_INTERNSHIPS.length}</strong>
                <span>updated openings</span>
              </div>
              <div class="hero-trust-pill">
                <strong>3-5</strong>
                <span>best-fit roles shown</span>
              </div>
              <div class="hero-trust-pill">
                <strong>AI</strong>
                <span>roadmap guidance</span>
              </div>
            </div>
          </div>

          <div class="hero-spotlight hero-spotlight-clean">
            <div class="hero-preview-card">
              <div class="preview-topline">
                <span class="preview-dot"></span>
                <span>Candidate journey preview</span>
              </div>
              <div class="preview-stage">
                <span class="preview-stage-num">01</span>
                <div>
                  <strong>Profile creation</strong>
                  <p>Capture education, location, and real skills before matching.</p>
                </div>
              </div>
              <div class="preview-stage">
                <span class="preview-stage-num">02</span>
                <div>
                  <strong>Best-fit internship shortlist</strong>
                  <p>See the strongest 3 to 5 roles based on skills, location, and education.</p>
                </div>
              </div>
              <div class="preview-stage">
                <span class="preview-stage-num">03</span>
                <div>
                  <strong>AI roadmap and apply flow</strong>
                  <p>Unlock skill-gap roles, then submit resume, CGPA, and candidate details.</p>
                </div>
              </div>
              <div class="preview-glow"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="stats-band">
        <div class="stats-band-inner">
          <div class="stats-item"><strong>${STATIC_INTERNSHIPS.length}</strong><span>updated internship records</span></div>
          <div class="stats-item"><strong>28+</strong><span>skill signals used for matching</span></div>
          <div class="stats-item"><strong>1 workflow</strong><span>profile, roadmap, progress, and apply tracking</span></div>
        </div>
      </section>

      <section class="content-section" id="featured-opportunities">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">Featured roles</span>
            <h2>Fresh opportunities across software, data, cloud, and mobile.</h2>
          </div>
        </div>
        <div class="featured-grid">
          ${featured.map(item => `
            <article class="feature-card feature-card-clean">
              <div class="feature-card-top">
                <span class="feature-icon">${item.icon}</span>
                <span class="feature-chip">${sanitize(TRACK_LABELS[item.sector] || item.sector)}</span>
              </div>
              <h3>${sanitize(item.title)}</h3>
              <p>${sanitize(item.org)} • ${sanitize(item.location)}</p>
              <div class="feature-meta">
                <span>${sanitize(item.jobType)}</span>
                <span>${sanitize(item.stipend)}</span>
              </div>
              <button class="feature-cta" onclick="App.openHomeInternship('${item.id}')">Open Internship</button>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="content-section about-section" id="about-us">
        <div class="about-panel about-panel-clean">
          <div>
            <span class="eyebrow">About us</span>
            <h2>A more practical internship journey for candidates.</h2>
          </div>
          <p>This portal is designed to reduce confusion during internship search. Instead of only showing matches, it explains why a role fits, what is missing, and how to unlock better opportunities through a structured roadmap.</p>
        </div>
      </section>

      <section class="content-section contact-section" id="contact-us">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">Contact us</span>
            <h2>Need help with your profile or roadmap?</h2>
          </div>
        </div>
        <div class="contact-grid">
          <article class="contact-card"><h3>Candidate Support</h3><p>support@pminternshipscheme.in</p><p>+91 1800-120-2024</p></article>
          <article class="contact-card"><h3>Hours</h3><p>Monday to Friday</p><p>9:00 AM to 6:00 PM IST</p></article>
          <article class="contact-card"><h3>Next step</h3><p>Create a candidate profile to unlock internship search and roadmap tracking.</p></article>
        </div>
      </section>

      <footer class="site-footer">
        <div class="site-footer-inner">
          <div>
            <h3>PM Internship Scheme</h3>
            <p>Professional internship discovery with skill-gap roadmaps and progress tracking.</p>
          </div>
          <div class="footer-links">
            <button onclick="App.goHome()">Home</button>
            <button onclick="App.scrollToHomeSection('about-us')">About Us</button>
            <button onclick="App.scrollToHomeSection('contact-us')">Contact Us</button>
            <button onclick="App.enterCandidateFlow()">Candidate Profile</button>
          </div>
        </div>
      </footer>
    `;
  }
};
