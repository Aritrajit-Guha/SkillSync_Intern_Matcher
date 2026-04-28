/**
 * ProfileForm — Renders the profile input form.
 */
const ProfileForm = {
  STATES: [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir',
    'Jharkhand','Karnataka','Kerala','Ladakh','Madhya Pradesh','Maharashtra',
    'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
    'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
    'West Bengal'
  ],
  EDU: [
    { v: 'class10',    l: 'Class 10 (Matric)' },
    { v: 'class12',    l: 'Class 12 (Intermediate)' },
    { v: 'diploma',    l: 'Diploma / ITI' },
    { v: 'graduation', l: 'Graduation (UG)' },
    { v: 'postgrad',   l: 'Post-Graduation (PG)' }
  ],
  STREAMS: [
    { v: 'science',   l: 'Science / Technology' },
    { v: 'commerce',  l: 'Commerce / Finance' },
    { v: 'arts',      l: 'Arts / Humanities' },
    { v: 'vocational',l: 'Vocational / ITI' },
    { v: 'agriculture',l: 'Agriculture' },
    { v: 'medical',   l: 'Medical / Paramedical' }
  ],
  SKILLS: {
    communication: 'Communication',
    finance:       'Finance',
    excel:         'MS Excel',
    digital:       'Digital Literacy',
    data:          'Data Analysis',
    coding:        'Coding / IT'
  },
  SECTORS: {
    agriculture: 'Agriculture 🌾',
    health:      'Health 🏥',
    technology:  'Technology 💻',
    finance:     'Finance 📊',
    social:      'Social Work 🤝',
    education:   'Education 📚',
    business:    'Business 🏭'
  },

  render(profile, translations) {
    const T = translations;
    return `
      <div class="section-head">
        <h2>${T.profileHead}</h2>
        <p>${T.profileSub}</p>
      </div>

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

      <div style="margin-top:28px">
        <button class="btn-primary" onclick="App.runMatching()" aria-label="${T.findBtn}">
          <span>${T.findBtn}</span>
        </button>
      </div>
    `;
  }
};