/**
 * main.js — Application bootstrap & global state manager.
 */

// ─── Static Data (used when backend unavailable) ──────────────────
const STATIC_INTERNSHIPS = [
  { id:'nabard', icon:'🌾', title:'Rural Finance Intern',          org:'NABARD',          sector:'agriculture', skills:['communication','finance'],          education:['graduation','postgrad'],            stipend:'₹4,500/mo', duration:'3 months', location:'Pan India',          seats:120 },
  { id:'cag',    icon:'📊', title:'Audit & Accounts Trainee',      org:'CAG of India',    sector:'finance',     skills:['finance','excel'],                  education:['graduation','postgrad'],            stipend:'₹5,000/mo', duration:'6 months', location:'Delhi / Remote',     seats:80  },
  { id:'mygov',  icon:'💻', title:'Digital Governance Intern',     org:'MyGov India',     sector:'technology',  skills:['communication','digital'],          education:['class12','graduation','postgrad'],  stipend:'₹3,000/mo', duration:'2 months', location:'Remote',             seats:200 },
  { id:'nhsrc',  icon:'🏥', title:'Health Systems Research Intern',org:'NHSRC',           sector:'health',      skills:['data','communication'],             education:['graduation','postgrad'],            stipend:'₹6,000/mo', duration:'3 months', location:'Delhi / Hybrid',     seats:50  },
  { id:'msme',   icon:'🏭', title:'MSME Development Intern',       org:'Min. of MSME',    sector:'business',    skills:['communication','excel','finance'],   education:['graduation','postgrad'],            stipend:'₹4,000/mo', duration:'3 months', location:'Pan India',          seats:150 },
  { id:'isro',   icon:'🚀', title:'Space Applications Intern',     org:'ISRO / NRSC',     sector:'technology',  skills:['coding','data','digital'],          education:['graduation','postgrad'],            stipend:'₹8,000/mo', duration:'6 months', location:'Hyderabad',          seats:30  },
  { id:'nrlm',   icon:'🤝', title:'Community Mobilisation Intern', org:'DAY-NRLM',        sector:'social',      skills:['communication'],                    education:['class12','graduation'],             stipend:'₹3,500/mo', duration:'3 months', location:'Rural Districts',    seats:300 },
  { id:'skill',  icon:'📚', title:'Skill Trainer Assistant',       org:'NSDC / PMKVY',    sector:'education',   skills:['communication','digital'],          education:['class10','class12','graduation'],   stipend:'₹3,000/mo', duration:'2 months', location:'Pan India',          seats:500 },
  { id:'aajiv',  icon:'🌿', title:'Livelihood Promotion Intern',   org:'Aajeevika Mission',sector:'agriculture', skills:['communication'],                   education:['class12','graduation'],             stipend:'₹3,500/mo', duration:'3 months', location:'Tribal / Rural',     seats:200 },
  { id:'dbt',    icon:'🧬', title:'Biotechnology Research Intern', org:'DBT India',        sector:'health',      skills:['data','coding'],                    education:['graduation','postgrad'],            stipend:'₹7,000/mo', duration:'6 months', location:'Pan India',          seats:40  }
];

const STATIC_COURSES = {
  communication: [
    { icon:'🗣️', title:'Effective Communication Skills', platform:'NPTEL',    duration:'4 weeks', url:'https://nptel.ac.in'   },
    { icon:'✍️', title:'Business Writing in English',    platform:'IGNOU',    duration:'2 weeks', url:'https://ignou.ac.in'   }
  ],
  finance: [
    { icon:'💰', title:'Basics of Financial Literacy',   platform:'NISM',     duration:'3 weeks', url:'https://nism.ac.in'    },
    { icon:'📈', title:'Accounting Fundamentals',        platform:'NIELIT',   duration:'4 weeks', url:'https://nielit.gov.in' }
  ],
  excel: [
    { icon:'📊', title:'MS Excel for Data Management',   platform:'PMKVY',    duration:'2 weeks', url:'https://pmkvyofficial.org' },
    { icon:'📉', title:'Spreadsheet Data Analysis',      platform:'NPTEL',    duration:'3 weeks', url:'https://nptel.ac.in'   }
  ],
  digital: [
    { icon:'💻', title:'Digital Literacy Programme',     platform:'PMGDISHA', duration:'2 weeks', url:'https://pmgdisha.in'   },
    { icon:'📱', title:'Introduction to Smartphones',    platform:'NIELIT',   duration:'1 week',  url:'https://nielit.gov.in' }
  ],
  data: [
    { icon:'📐', title:'Data Analysis Basics',           platform:'NPTEL',    duration:'4 weeks', url:'https://nptel.ac.in'   },
    { icon:'🔢', title:'Statistics for Beginners',       platform:'SWAYAM',   duration:'3 weeks', url:'https://swayam.gov.in' }
  ],
  coding: [
    { icon:'🐍', title:'Python Programming Basics',      platform:'NPTEL',    duration:'6 weeks', url:'https://nptel.ac.in'   },
    { icon:'🌐', title:'Web Development Fundamentals',   platform:'NIELIT',   duration:'4 weeks', url:'https://nielit.gov.in' }
  ]
};

// ─── I18N Loader ──────────────────────────────────────────────────
const TRANSLATIONS = {};
['en','hi','bn','te','mr','ta'].forEach(code => {
  fetch(`src/i18n/${code}.json`)
    .then(r => r.json())
    .then(data => { TRANSLATIONS[code] = data; })
    .catch(() => {});
});

// ─── App State ────────────────────────────────────────────────────
window.APP_STATE = {
  lang:             'en',
  step:             1,
  profile:          { state:'', education:'', stream:'', skills:[], sectors:[] },
  results:          [],
  roadmapFor:       null,
  completedCourses: new Set(),
  xp:               0,
  activities:       [],
  doneSteps:        new Set(),
  translations:     null
};

// ─── App Controller ───────────────────────────────────────────────
const App = {
  // ── Init ──────────────────────────────────────────────────────
  init() {
    this.loadPersisted();
    this.applyLang('en');
    this.goStep(1);
  },

  loadPersisted() {
    const saved = Storage.get('appState');
    if (saved) {
      APP_STATE.xp         = saved.xp || 0;
      APP_STATE.activities = saved.activities || [];
      APP_STATE.doneSteps  = new Set(saved.doneSteps || []);
      APP_STATE.completedCourses = new Set(saved.completedCourses || []);
      APP_STATE.profile    = saved.profile || APP_STATE.profile;
      APP_STATE.lang       = saved.lang || 'en';
    }
  },

  persist() {
    Storage.set('appState', {
      xp:               APP_STATE.xp,
      activities:       APP_STATE.activities,
      doneSteps:        [...APP_STATE.doneSteps],
      completedCourses: [...APP_STATE.completedCourses],
      profile:          APP_STATE.profile,
      lang:             APP_STATE.lang
    });
  },

  // ── Language ──────────────────────────────────────────────────
  applyLang(code) {
    APP_STATE.lang = code;
    // Try loaded translations, fallback to embedded
    const T = TRANSLATIONS[code];
    if (T) {
      APP_STATE.translations = T;
    } else {
      // minimal fallback
      APP_STATE.translations = {
        profileHead:'Build Your Profile', profileSub:'Tell us about yourself.',
        stateLabel:'State', statePlaceholder:'— Select —',
        eduLabel:'Education', eduPlaceholder:'— Select —',
        streamLabel:'Stream', streamPlaceholder:'— Select —',
        skillsLabel:'Skills', skillsHint:'Select all', sectorLabel:'Sectors', sectorHint:'Pick sectors',
        findBtn:'Find Internships →', matchHead:'Your Matches', matchSub:'internships found',
        upskillHead:'Learning Roadmap', upskillSub:'Close skill gaps',
        progressHead:'Your Progress', progressSub:'Track XP and badges',
        statusEligible:'✅ Eligible', statusNear:'⚡ Near-miss', statusGap:'📚 Build Skills',
        applyNow:'Apply Now', viewRoadmap:'View Roadmap', learnFirst:'Learn First',
        gapLabel:'Missing:', overallProgress:'Progress', courses:'courses',
        nowEligible:'🎉 Now Eligible!', nowEligibleSub:'All gaps closed.',
        backToApply:'← Back to Apply', activityLog:'Activity', badges:'Badges',
        totalXP:'Total XP', level:'Level', nextLevel:'Next',
        completeProfile:'Complete your profile to start!',
        markComplete:'Mark complete', noMatches:'No matches found.',
        loading:'Loading...', error:'Error. Try again.'
      };
    }
    document.getElementById('header-title').textContent = APP_STATE.translations.title || 'PM Internship Scheme';
    document.getElementById('header-sub').textContent   = APP_STATE.translations.subtitle || '';
    LanguageToggle.render(code, c => App.applyLang(c));
    this.renderCurrentStep();
    this.persist();
    const names = { en:'🇬🇧 English', hi:'🇮🇳 हिन्दी', bn:'🇧🇩 বাংলা', te:'🇮🇳 తెలుగు', mr:'🇮🇳 मराठी', ta:'🇮🇳 தமிழ்' };
    showToast(names[code] || code);
  },

  // ── Step Navigation ───────────────────────────────────────────
  goStep(n) {
    APP_STATE.step = n;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const map = { 1:'sec-profile', 2:'sec-matches', 3:'sec-upskill', 4:'sec-progress' };
    const sec = document.getElementById(map[n]);
    if (sec) {
      sec.classList.add('active');
      sec.scrollIntoView({ behavior:'smooth', block:'start' });
    }
    StepTabs.render(n, APP_STATE.doneSteps, APP_STATE.translations.steps || ['Profile','Matches','Upskill','Progress']);
    this.renderCurrentStep();
  },

  renderCurrentStep() {
    StepTabs.render(APP_STATE.step, APP_STATE.doneSteps, APP_STATE.translations.steps || ['Profile','Matches','Upskill','Progress']);
    switch (APP_STATE.step) {
      case 1: ProfilePage.render(APP_STATE);   break;
      case 2: MatchesPage.render(APP_STATE);   break;
      case 3: RoadmapPage.render(APP_STATE);   break;
      case 4: ProgressPage.render(APP_STATE);  break;
    }
  },

  // ── Profile ───────────────────────────────────────────────────
  updateProfile(key, value) {
    APP_STATE.profile[key] = value;
  },

  toggleSkill(v) {
    const arr = APP_STATE.profile.skills;
    const idx = arr.indexOf(v);
    if (idx === -1) arr.push(v); else arr.splice(idx, 1);
    SkillChip.update('skill', v, arr.includes(v));
  },

  toggleSector(v) {
    const arr = APP_STATE.profile.sectors;
    const idx = arr.indexOf(v);
    if (idx === -1) arr.push(v); else arr.splice(idx, 1);
    SkillChip.update('sector', v, arr.includes(v));
  },

  // ── Matching Engine ───────────────────────────────────────────
  runMatching() {
    const p = APP_STATE.profile;
    if (!p.education) { showToast('⚠️ Please select your education level'); return; }

    const scored = STATIC_INTERNSHIPS.map(intern => {
      let score = 0;
      const missing = [];

      // Education match (30 pts)
      if (intern.education.includes(p.education)) score += 30;
      else score += 8;

      // Skills match (50 pts)
      const w = intern.skills.length > 0 ? 50 / intern.skills.length : 0;
      for (const s of intern.skills) {
        if (p.skills.includes(s)) score += w;
        else missing.push(s);
      }

      // Sector match (20 pts)
      if (p.sectors.includes(intern.sector)) score += 20;

      const status = missing.length === 0 ? 'eligible'
                   : missing.length <= 2   ? 'near-miss'
                   : 'gap';

      return { ...intern, score: Math.round(score), missingSkills: missing, status };
    }).sort((a,b) => b.score - a.score).slice(0, 5);

    APP_STATE.results   = scored;
    APP_STATE.doneSteps.add(1);

    this.addXP(30, '🌱 Profile created', 'green', 'profile_done');
    MatchesPage.render(APP_STATE);
    this.goStep(2);
    fireConfetti();
    this.persist();
  },

  // ── Apply / Roadmap ───────────────────────────────────────────
  onApply(id) {
    this.addXP(50, `✅ Applied for internship`, 'green', `apply_${id}`);
    showToast('🎉 Application noted! +50 XP');
    fireConfetti();
    this.persist();
  },

  onRoadmap(id) {
    APP_STATE.roadmapFor = id;
    APP_STATE.doneSteps.add(2);
    RoadmapPage.render(APP_STATE);
    this.goStep(3);
  },

  // ── Course Completion ─────────────────────────────────────────
  markCourse(cid) {
    if (APP_STATE.completedCourses.has(cid)) return;
    APP_STATE.completedCourses.add(cid);
    APP_STATE.doneSteps.add(3);

    this.addXP(25, `📚 Completed a course`, 'sky', `course_${cid}`);
    showToast('📚 Course complete! +25 XP');

    // Check if all courses for this roadmap are done
    const intern = APP_STATE.results.find(r => r.id === APP_STATE.roadmapFor);
    if (intern) {
      const all = intern.missingSkills.flatMap(skill =>
        (STATIC_COURSES[skill]||[]).map(c => `${skill}-${c.title.replace(/\s+/g,'_')}`)
      );
      if (all.length > 0 && all.every(c => APP_STATE.completedCourses.has(c))) {
        fireConfetti();
        this.addXP(100, `🏆 Internship unlocked!`, 'green', `unlock_${intern.id}`);
        showToast('🏆 Internship Unlocked! +100 XP');
      }
    }

    RoadmapPage.render(APP_STATE);
    ProgressPage.render(APP_STATE);
    StepTabs.render(APP_STATE.step, APP_STATE.doneSteps, APP_STATE.translations.steps);
    this.persist();
  },

  // ── XP System ─────────────────────────────────────────────────
  addXP(amount, text, color, id) {
    if (APP_STATE.activities.find(a => a.id === id)) return;
    APP_STATE.xp += amount;
    APP_STATE.activities.push({ id, xp: amount, text, color });
    if (APP_STATE.step === 4) ProgressPage.render(APP_STATE);
  }
};

// ─── Boot ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());