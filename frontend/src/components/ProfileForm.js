/**
 * ProfileForm - Candidate profile builder for role and skill matching.
 */
const ProfileForm = {
  STATES: [
    'Remote', 'Delhi', 'Odisha', 'Karnataka', 'Haryana', 'West Bengal', 'Rajasthan',
    'Kerala', 'Chandigarh', 'Gujarat', 'Uttar Pradesh', 'Maharashtra', 'Tamil Nadu', 'Telangana'
  ],
  EDU: [
    { v: 'class12', l: 'Class 12' },
    { v: 'graduation', l: 'Graduation' },
    { v: 'postgrad', l: 'Post-Graduation' }
  ],
  STREAMS: [
    { v: 'engineering', l: 'Engineering / Computer Science' },
    { v: 'analytics', l: 'Analytics / Data' },
    { v: 'design', l: 'Design / Product' },
    { v: 'general', l: 'General / Open to all tech roles' }
  ],
  SKILLS: {
    python: 'Python',
    javascript: 'JavaScript',
    react: 'React',
    nodejs: 'Node.js',
    django: 'Django',
    flask: 'Flask',
    fastapi: 'FastAPI',
    sql: 'SQL',
    mongodb: 'MongoDB',
    aws: 'AWS',
    docker: 'Docker',
    git: 'Git',
    typescript: 'TypeScript',
    "machine-learning": 'Machine Learning',
    "data-analysis": 'Data Analysis',
    pandas: 'Pandas',
    numpy: 'NumPy',
    "html-css": 'HTML/CSS',
    java: 'Java',
    cpp: 'C++',
    figma: 'Figma',
    "ui-ux": 'UI/UX',
    "spring-boot": 'Spring Boot',
    express: 'Express',
    linux: 'Linux',
    jira: 'JIRA',
    "problem-solving": 'Problem Solving',
    tensorflow: 'TensorFlow'
  },
  SECTORS: {
    engineering: 'Software Engineering',
    "web-product": 'Frontend / Full Stack',
    "cloud-devops": 'Cloud / DevOps',
    "ai-data": 'AI / Machine Learning',
    analytics: 'Data / Business Analysis',
    mobile: 'Mobile Development',
    quality: 'QA / Testing'
  },

  render(profile, translations) {
    const T = translations;
    return `
      <div class="section-head">
        <h2>${T.profileHead}</h2>
        <p>${T.profileSub}</p>
      </div>

      <div class="card profile-form-card">
        <div class="card-title">Candidate Snapshot</div>

        <div class="field-grid">
          <div class="field">
            <label for="inp-state">${T.stateLabel}</label>
            <select id="inp-state" onchange="App.updateProfile('state', this.value)" aria-label="${T.stateLabel}">
              <option value="">${T.statePlaceholder}</option>
              ${this.STATES.map(s => `<option value="${s}"${profile.state===s?' selected':''}>${s}</option>`).join('')}
            </select>
          </div>

          <div class="field">
            <label for="inp-edu">${T.eduLabel}</label>
            <select id="inp-edu" onchange="App.updateProfile('education', this.value)" aria-label="${T.eduLabel}">
              <option value="">${T.eduPlaceholder}</option>
              ${this.EDU.map(e => `<option value="${e.v}"${profile.education===e.v?' selected':''}>${e.l}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="field">
          <label for="inp-stream">${T.streamLabel}</label>
          <select id="inp-stream" onchange="App.updateProfile('stream', this.value)" aria-label="${T.streamLabel}">
            <option value="">${T.streamPlaceholder}</option>
            ${this.STREAMS.map(s => `<option value="${s.v}"${profile.stream===s.v?' selected':''}>${s.l}</option>`).join('')}
          </select>
        </div>

        <div class="field">
          <label>${T.skillsLabel} <span class="field-hint">${T.skillsHint}</span></label>
          <div class="chip-grid" id="chips-skills">
            ${Object.entries(this.SKILLS).map(([v, l]) =>
              SkillChip.render({ value: v, label: l, selected: profile.skills.includes(v), type: 'skill', onToggle: 'App.toggleSkill' })
            ).join('')}
          </div>
        </div>

        <div class="field">
          <label>${T.sectorLabel} <span class="field-hint">${T.sectorHint}</span></label>
          <div class="chip-grid" id="chips-sectors">
            ${Object.entries(this.SECTORS).map(([v, l]) =>
              SkillChip.render({ value: v, label: l, selected: profile.sectors.includes(v), type: 'sector', onToggle: 'App.toggleSector' })
            ).join('')}
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-primary" onclick="App.runMatching()" aria-label="${T.findBtn}">
            <span>${T.findBtn}</span>
          </button>
        </div>
      </div>
    `;
  }
};
