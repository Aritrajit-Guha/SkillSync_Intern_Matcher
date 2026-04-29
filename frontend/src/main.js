/**
 * main.js - Application bootstrap and global state manager.
 */

const STATIC_INTERNSHIPS = window.INTERNSHIP_DATA || [];
const SKILL_LABELS = { ...ProfileForm.SKILLS };
const TRACK_LABELS = { ...ProfileForm.SECTORS };

const SKILL_COACH = {
  python: "Start with Python syntax, functions, and backend problem solving. Then build one API-focused mini project.",
  javascript: "Focus on DOM logic, async behavior, and interactive UI flows before moving into production patterns.",
  react: "Learn components, props, state, and layout composition. Finish with a reusable dashboard project.",
  nodejs: "Practice server basics, API routes, and data handling so you can support backend-driven products.",
  django: "Cover models, views, forms, and authentication. End with a small CRUD app deployment.",
  flask: "Use Flask for lightweight APIs and service logic. Build confidence with small production-like projects.",
  fastapi: "Learn request validation, async endpoints, and clean API design for modern backend roles.",
  sql: "Work on SELECT, JOIN, aggregation, and filtering until query writing becomes natural.",
  mongodb: "Practice document modeling, CRUD operations, and connecting data to app features.",
  aws: "Understand cloud basics, deployment flow, storage, and compute services used in real teams.",
  docker: "Learn containers, image basics, and how to run repeatable local environments.",
  git: "Improve commit hygiene, branching, pull requests, and collaboration safety.",
  typescript: "Focus on typed interfaces, props, and safer app logic in frontend and backend work.",
  "machine-learning": "Strengthen data preparation, evaluation, and model experimentation before larger projects.",
  "data-analysis": "Build comfort with cleaning, trends, dashboards, and communicating insights clearly.",
  pandas: "Practice filtering, joins, grouping, and shaping messy datasets into useful outputs.",
  numpy: "Work on arrays, vectorized operations, and numeric thinking for technical problem solving.",
  "html-css": "Refine semantic structure, layout systems, spacing, and responsive interface building.",
  java: "Cover OOP basics, collections, backend fundamentals, and practical debugging patterns.",
  cpp: "Improve fundamentals, memory awareness, and structured problem solving through focused exercises.",
  figma: "Learn interface framing, component systems, and developer-ready design handoff.",
  "ui-ux": "Strengthen usability thinking, interaction flows, and user-centered decision making.",
  "spring-boot": "Practice service architecture, REST APIs, and production-style backend structure.",
  express: "Use Express to learn routing, middleware, and lightweight service construction.",
  linux: "Build confidence with terminal usage, file systems, and basic environment troubleshooting.",
  jira: "Improve planning discipline, issue tracking, and team workflow visibility.",
  "problem-solving": "Show structured thinking by breaking unclear tasks into steps, tradeoffs, and outcomes.",
  tensorflow: "Focus on ML workflows, model training, and practical experimentation patterns."
};

const COURSE_TEMPLATES = {
  default: skill => ([
    { icon: "📘", title: `${skill} Foundations`, platform: "Skill Bridge", duration: "1 week", url: "#" },
    { icon: "🧪", title: `${skill} Project Practice`, platform: "Career Launchpad", duration: "2 weeks", url: "#" }
  ]),
  java: () => ([
    { icon: "☕", title: "Java Basics to OOP", platform: "Developer Track", duration: "1 week", url: "#" },
    { icon: "🧩", title: "Java Mini Backend Project", platform: "Project Lab", duration: "2 weeks", url: "#" }
  ]),
  python: () => ([
    { icon: "🐍", title: "Python for Backend Work", platform: "Developer Track", duration: "1 week", url: "#" },
    { icon: "🔌", title: "Build a Python API Project", platform: "Project Lab", duration: "2 weeks", url: "#" }
  ]),
  react: () => ([
    { icon: "⚛️", title: "React UI Foundations", platform: "Frontend Academy", duration: "1 week", url: "#" },
    { icon: "💡", title: "Build a Reusable Dashboard in React", platform: "Project Lab", duration: "2 weeks", url: "#" }
  ]),
  aws: () => ([
    { icon: "☁️", title: "AWS Cloud Foundations", platform: "AWS Educate", duration: "1 week", url: "#" },
    { icon: "🛠️", title: "Deploy a Sample Service on AWS", platform: "Hands-on Lab", duration: "2 weeks", url: "#" }
  ]),
  "machine-learning": () => ([
    { icon: "🤖", title: "Machine Learning Essentials", platform: "AI Foundations", duration: "2 weeks", url: "#" },
    { icon: "📈", title: "Train and Evaluate a Small Model", platform: "Experiment Lab", duration: "2 weeks", url: "#" }
  ]),
  "data-analysis": () => ([
    { icon: "📊", title: "Data Analysis Essentials", platform: "Analytics Track", duration: "1 week", url: "#" },
    { icon: "🧾", title: "Create an Insight Dashboard", platform: "Project Lab", duration: "2 weeks", url: "#" }
  ])
};

function createCourseLibrary() {
  const skills = [...new Set(STATIC_INTERNSHIPS.flatMap(item => item.skills || []))];
  return skills.reduce((acc, skillKey) => {
    const label = SKILL_LABELS[skillKey] || skillKey;
    const factory = COURSE_TEMPLATES[skillKey] || COURSE_TEMPLATES.default;
    acc[skillKey] = factory(label);
    return acc;
  }, {});
}

const STATIC_COURSES = createCourseLibrary();

const TRANSLATIONS = {};
['en','hi','bn','te','mr','ta'].forEach(code => {
  fetch(`src/i18n/${code}.json`)
    .then(r => r.json())
    .then(data => { TRANSLATIONS[code] = data; })
    .catch(() => {});
});

window.APP_STATE = {
  currentView: 'home',
  lang: 'en',
  step: 1,
  profile: { state:'', education:'', stream:'', skills:[], sectors:[] },
  results: [],
  roadmapFor: null,
  applyFor: null,
  selectedHomeInternship: null,
  completedCourses: new Set(),
  appliedInternships: new Set(),
  applicationDrafts: {},
  xp: 0,
  activities: [],
  doneSteps: new Set(),
  translations: null
};

const App = {
  init() {
    this.loadPersisted();
    this.applyLang(APP_STATE.lang || 'en');
    this.renderLayout();
    this.setActiveStepSection(APP_STATE.step || 1);
    this.renderCurrentStep();
  },

  loadPersisted() {
    const saved = Storage.get('appState');
    if (!saved) return;
    APP_STATE.currentView = saved.currentView || 'home';
    APP_STATE.lang = saved.lang || 'en';
    APP_STATE.step = saved.step || 1;
    APP_STATE.profile = saved.profile || APP_STATE.profile;
    APP_STATE.results = saved.results || [];
    APP_STATE.roadmapFor = saved.roadmapFor || null;
    APP_STATE.applyFor = saved.applyFor || null;
    APP_STATE.selectedHomeInternship = saved.selectedHomeInternship || null;
    APP_STATE.completedCourses = new Set(saved.completedCourses || []);
    APP_STATE.appliedInternships = new Set(saved.appliedInternships || []);
    APP_STATE.applicationDrafts = saved.applicationDrafts || {};
    APP_STATE.xp = saved.xp || 0;
    APP_STATE.activities = saved.activities || [];
    APP_STATE.doneSteps = new Set(saved.doneSteps || []);
  },

  persist() {
    Storage.set('appState', {
      currentView: APP_STATE.currentView,
      lang: APP_STATE.lang,
      step: APP_STATE.step,
      profile: APP_STATE.profile,
      results: APP_STATE.results,
      roadmapFor: APP_STATE.roadmapFor,
      applyFor: APP_STATE.applyFor,
      selectedHomeInternship: APP_STATE.selectedHomeInternship,
      completedCourses: [...APP_STATE.completedCourses],
      appliedInternships: [...APP_STATE.appliedInternships],
      applicationDrafts: APP_STATE.applicationDrafts,
      xp: APP_STATE.xp,
      activities: APP_STATE.activities,
      doneSteps: [...APP_STATE.doneSteps]
    });
  },

  getFallbackTranslations() {
    return {
      title:'PM Internship Scheme',
      subtitle:'Professional internship matching with guided upskilling',
      profileHead:'Create your candidate profile',
      profileSub:'Add your location, education, and skills so we can show the strongest matches.',
      stateLabel:'Preferred location',
      statePlaceholder:'Select location',
      eduLabel:'Education level',
      eduPlaceholder:'Select education',
      streamLabel:'Primary focus',
      streamPlaceholder:'Select focus area',
      skillsLabel:'Current skills',
      skillsHint:'Choose the skills you already have',
      sectorLabel:'Role tracks',
      sectorHint:'Choose the tracks you want to target',
      findBtn:'Search internships',
      matchHead:'Recommended internships',
      matchSub:'best-fit roles',
      upskillHead:'AI roadmap coach',
      upskillSub:'Use the chatbot roadmap to close skill gaps and unlock applications.',
      progressHead:'Progress hub',
      progressSub:'Track readiness, applications, and progress in one place.',
      statusEligible:'Eligible now',
      statusNear:'Close match',
      statusGap:'Needs roadmap',
      applyNow:'Apply now',
      viewRoadmap:'Open roadmap',
      learnFirst:'Start roadmap',
      gapLabel:'Skill gaps',
      overallProgress:'Readiness',
      courses:'learning steps',
      nowEligible:'Application unlocked',
      nowEligibleSub:'You completed the roadmap. The internship can now be applied for.',
      backToApply:'Back to internships',
      activityLog:'Recent activity',
      badges:'Milestones',
      totalXP:'Total XP',
      level:'Level',
      nextLevel:'Next level',
      completeProfile:'Complete your profile to begin tracking progress.',
      markComplete:'Mark complete',
      noMatches:'No internships match yet. Add more skills or adjust your target tracks.',
      loading:'Loading...',
      error:'Something went wrong. Please try again.',
      steps:['Profile','Matches','Roadmap','Progress','Apply']
    };
  },

  applyLang(code) {
    APP_STATE.lang = code;
    APP_STATE.translations = TRANSLATIONS[code] || this.getFallbackTranslations();
    const title = document.getElementById('header-title');
    const sub = document.getElementById('header-sub');
    if (title) title.textContent = APP_STATE.translations.title || 'PM Internship Scheme';
    if (sub) sub.textContent = APP_STATE.translations.subtitle || 'Professional internship matching with guided upskilling';
    LanguageToggle.render(code, lang => App.applyLang(lang));
    this.renderLayout();
    this.renderCurrentStep();
    this.persist();
  },

  renderLayout() {
    HomePage.render(APP_STATE);
    this.syncView();
  },

  syncView() {
    const home = document.getElementById('home-view');
    const candidate = document.getElementById('candidate-view');
    if (home) home.style.display = APP_STATE.currentView === 'home' ? 'block' : 'none';
    if (candidate) candidate.style.display = APP_STATE.currentView === 'candidate' ? 'block' : 'none';
  },

  enterCandidateFlow() {
    APP_STATE.currentView = 'candidate';
    this.syncView();
    this.setActiveStepSection(APP_STATE.step || 1);
    this.renderCurrentStep();
    this.persist();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goHome() {
    APP_STATE.currentView = 'home';
    this.syncView();
    this.persist();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  scrollToHomeSection(id) {
    if (APP_STATE.currentView !== 'home') {
      APP_STATE.currentView = 'home';
      this.syncView();
    }
    this.persist();
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  },

  openHomeInternship(id) {
    APP_STATE.selectedHomeInternship = id;
    APP_STATE.currentView = 'candidate';
    APP_STATE.step = 1;
    this.syncView();
    this.setActiveStepSection(1);
    this.renderCurrentStep();
    this.persist();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setActiveStepSection(n) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    const map = { 1:'sec-profile', 2:'sec-matches', 3:'sec-upskill', 4:'sec-progress', 5:'sec-apply' };
    const current = document.getElementById(map[n]);
    if (current) current.classList.add('active');
  },

  goStep(n) {
    APP_STATE.step = n;
    APP_STATE.currentView = 'candidate';
    this.syncView();
    this.setActiveStepSection(n);
    StepTabs.render(n, APP_STATE.doneSteps, APP_STATE.translations.steps || ['Profile','Matches','Roadmap','Progress','Apply']);
    this.renderCurrentStep();
    this.persist();
  },

  renderCurrentStep() {
    StepTabs.render(APP_STATE.step, APP_STATE.doneSteps, APP_STATE.translations.steps || ['Profile','Matches','Roadmap','Progress','Apply']);
    switch (APP_STATE.step) {
      case 1: ProfilePage.render(APP_STATE); break;
      case 2: MatchesPage.render(APP_STATE); break;
      case 3: RoadmapPage.render(APP_STATE); break;
      case 4: ProgressPage.render(APP_STATE); break;
      case 5: ApplyPage.render(APP_STATE); break;
    }
  },

  updateProfile(key, value) {
    APP_STATE.profile[key] = value;
    this.persist();
  },

  toggleSkill(v) {
    const arr = APP_STATE.profile.skills;
    const idx = arr.indexOf(v);
    if (idx === -1) arr.push(v); else arr.splice(idx, 1);
    SkillChip.update('skill', v, arr.includes(v));
    this.persist();
  },

  toggleSector(v) {
    const arr = APP_STATE.profile.sectors;
    const idx = arr.indexOf(v);
    if (idx === -1) arr.push(v); else arr.splice(idx, 1);
    SkillChip.update('sector', v, arr.includes(v));
    this.persist();
  },

  normalizeResults(results) {
    return results.map(item => {
      const profileSkills = new Set(APP_STATE.profile.skills);
      const matchedSkills = (item.skills || []).filter(skill => profileSkills.has(skill));
      const missingSkills = (item.skills || []).filter(skill => !profileSkills.has(skill));
      const skillScore = (item.skills || []).length ? (matchedSkills.length / item.skills.length) * 55 : 0;
      const statePref = (APP_STATE.profile.state || '').toLowerCase();
      const locationText = `${item.location || ''} ${item.state || ''}`.toLowerCase();
      const locationScore = !statePref ? 8 : locationText.includes(statePref) || locationText.includes('remote') ? 20 : 0;
      const educationScore = (item.education || []).includes(APP_STATE.profile.education) ? 15 : 2;
      const sectorScore = APP_STATE.profile.sectors.includes(item.sector) ? 10 : 0;
      const experienceScore = ['Fresher', 'Entry-level', '0-1 Years', '0-6 Months'].includes(item.experience) ? 10 : 4;
      const score = clamp(Math.round(skillScore + locationScore + educationScore + sectorScore + experienceScore), 5, 100);
      const status = missingSkills.length === 0 ? 'eligible' : missingSkills.length <= 2 ? 'near-miss' : 'gap';
      return { ...item, score, matchedSkills, missingSkills, status };
    }).sort((a, b) => {
      if (APP_STATE.selectedHomeInternship && a.id === APP_STATE.selectedHomeInternship) return -1;
      if (APP_STATE.selectedHomeInternship && b.id === APP_STATE.selectedHomeInternship) return 1;
      return b.score - a.score;
    });
  },

  runMatching() {
    if (!APP_STATE.profile.education || APP_STATE.profile.skills.length === 0) {
      showToast('Add education and at least one skill to get strong internship matches.');
      return;
    }

    const normalized = this.normalizeResults(STATIC_INTERNSHIPS);
    APP_STATE.results = normalized.slice(0, 5);
    APP_STATE.doneSteps.add(1);
    this.addXP(30, 'Created candidate profile', 'green', 'profile_done');
    this.persist();

    if (APP_STATE.selectedHomeInternship) {
      const target = this.getInternshipById(APP_STATE.selectedHomeInternship);
      if (target) {
        const progress = this.getInternshipProgress(target);
        if (progress.unlocked) {
          this.openApplyPage(target.id);
          return;
        }
        APP_STATE.roadmapFor = target.id;
        this.goStep(3);
        return;
      }
    }

    this.goStep(2);
    fireConfetti(24);
  },

  getCoursesForSkill(skillKey) {
    return STATIC_COURSES[skillKey] || COURSE_TEMPLATES.default(SKILL_LABELS[skillKey] || skillKey);
  },

  getCourseId(skillKey, title) {
    return `${skillKey}-${title.replace(/\s+/g, '_')}`;
  },

  getInternshipById(id) {
    return APP_STATE.results.find(item => item.id === id) || STATIC_INTERNSHIPS.find(item => item.id === id);
  },

  getInternshipProgress(internship) {
    const missingSkills = internship.missingSkills || [];
    const courseItems = missingSkills.flatMap(skill => this.getCoursesForSkill(skill).map(course => ({
      id: this.getCourseId(skill, course.title),
      skill
    })));
    const done = courseItems.filter(item => APP_STATE.completedCourses.has(item.id)).length;
    const total = courseItems.length;
    const percent = total === 0 ? 100 : Math.round((done / total) * 100);
    return { total, done, percent, unlocked: percent === 100, missingSkills };
  },

  getInternshipAction(internship) {
    const progress = this.getInternshipProgress(internship);
    const applied = APP_STATE.appliedInternships.has(internship.id);
    if (applied) return { label: 'Applied', className: 'applied', disabled: true, action: '' };
    if (progress.unlocked) return { label: 'Apply now', className: 'apply', disabled: false, action: `App.openApplyPage('${internship.id}')` };
    return { label: 'Open roadmap', className: 'roadmap', disabled: false, action: `App.onRoadmap('${internship.id}')` };
  },

  buildCoachPlan(internship) {
    const progress = this.getInternshipProgress(internship);
    const chat = progress.missingSkills.map(skill => ({
      skill,
      label: SKILL_LABELS[skill] || skill,
      summary: SKILL_COACH[skill] || 'Build practical confidence through short, focused project work.'
    }));
    return {
      heading: progress.unlocked
        ? `You are now ready to apply for ${internship.title}.`
        : `Here is your roadmap for ${internship.title}.`,
      message: progress.unlocked
        ? 'The application step is unlocked. You can move directly to the application form.'
        : `The chatbot has mapped your missing skills and generated a focused plan to close them.`,
      plan: chat
    };
  },

  onRoadmap(id) {
    APP_STATE.roadmapFor = id;
    APP_STATE.doneSteps.add(2);
    this.goStep(3);
  },

  markCourse(cid) {
    if (APP_STATE.completedCourses.has(cid)) return;
    APP_STATE.completedCourses.add(cid);
    APP_STATE.doneSteps.add(3);
    this.addXP(25, 'Completed a roadmap step', 'sky', `course_${cid}`);
    const internship = this.getInternshipById(APP_STATE.roadmapFor);
    if (internship && this.getInternshipProgress(internship).unlocked) {
      this.addXP(100, `Unlocked ${internship.title}`, 'green', `unlock_${internship.id}`);
      showToast('Roadmap complete. Application unlocked.');
    } else {
      showToast('Roadmap step completed');
    }
    MatchesPage.render(APP_STATE);
    RoadmapPage.render(APP_STATE);
    ProgressPage.render(APP_STATE);
    this.persist();
  },

  openApplyPage(id) {
    const internship = this.getInternshipById(id);
    if (!internship) return;
    const progress = this.getInternshipProgress(internship);
    if (!progress.unlocked || APP_STATE.appliedInternships.has(id)) {
      showToast(progress.unlocked ? 'This internship is already applied.' : 'Complete the roadmap to unlock this application.');
      return;
    }
    APP_STATE.applyFor = id;
    APP_STATE.doneSteps.add(4);
    this.goStep(5);
  },

  updateApplicationDraft(internshipId, key, value) {
    const draft = APP_STATE.applicationDrafts[internshipId] || {};
    draft[key] = value;
    APP_STATE.applicationDrafts[internshipId] = draft;
    this.persist();
  },

  captureResume(internshipId, input) {
    const file = input.files && input.files[0];
    if (!file) return;
    this.updateApplicationDraft(internshipId, 'resumeName', file.name);
    showToast('Resume selected');
    ApplyPage.render(APP_STATE);
  },

  submitApplication(internshipId) {
    const draft = APP_STATE.applicationDrafts[internshipId] || {};
    if (!draft.fullName || !draft.email || !draft.phone || !draft.cgpa || !draft.college || !draft.resumeName) {
      showToast('Please complete all required application details and upload your resume.');
      return;
    }
    if (APP_STATE.appliedInternships.has(internshipId)) return;
    APP_STATE.appliedInternships.add(internshipId);
    APP_STATE.doneSteps.add(5);
    this.addXP(60, `Applied for ${this.getInternshipById(internshipId)?.title || 'internship'}`, 'green', `apply_${internshipId}`);
    showToast('Application submitted');
    this.goStep(2);
  },

  getCandidateSummary() {
    const unlocked = APP_STATE.results.filter(item => this.getInternshipProgress(item).unlocked).length;
    return { unlocked, applied: APP_STATE.appliedInternships.size, total: APP_STATE.results.length };
  },

  addXP(amount, text, color, id) {
    if (APP_STATE.activities.find(item => item.id === id)) return;
    APP_STATE.xp += amount;
    APP_STATE.activities.push({ id, xp: amount, text, color });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
