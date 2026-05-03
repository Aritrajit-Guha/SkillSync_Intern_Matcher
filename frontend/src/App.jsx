import { useEffect, useMemo, useState } from 'react';
import LanguageToggle from './components/LanguageToggle.jsx';
import StepTabs from './components/StepTabs.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import RoadmapPage from './pages/RoadmapPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import ApplyPage from './pages/ApplyPage.jsx';
import { API } from './utils/api.js';
import { Storage } from './utils/storage.js';
import { clamp, fireConfetti, showToast } from './utils/helpers.js';
import internships from './data/internships.json';
import {
  COURSE_TEMPLATES,
  LANGUAGES,
  SKILL_COACH,
  SKILL_LABELS,
  TRACK_LABELS,
  createCourseLibrary,
  getFallbackTranslations,
} from './data/catalog.js';
import en from './i18n/en.json';
import hi from './i18n/hi.json';
import bn from './i18n/bn.json';
import te from './i18n/te.json';
import mr from './i18n/mr.json';
import ta from './i18n/ta.json';

const TRANSLATIONS = { en, hi, bn, te, mr, ta };
const STATIC_INTERNSHIPS = internships;
const STATIC_COURSES = createCourseLibrary(STATIC_INTERNSHIPS);

const emptyState = {
  currentView: 'home',
  lang: 'en',
  step: 1,
  profile: { state: '', education: '', stream: '', skills: [], sectors: [] },
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
  isMatching: false,
};

function loadInitialState() {
  const saved = Storage.get('appState');
  if (!saved) return emptyState;

  return {
    ...emptyState,
    ...saved,
    profile: saved.profile || emptyState.profile,
    completedCourses: new Set(saved.completedCourses || []),
    appliedInternships: new Set(saved.appliedInternships || []),
    doneSteps: new Set(saved.doneSteps || []),
    activities: saved.activities || [],
    results: saved.results || [],
    applicationDrafts: saved.applicationDrafts || {},
    isMatching: false,
  };
}

function serializeState(state) {
  return {
    currentView: state.currentView,
    lang: state.lang,
    step: state.step,
    profile: state.profile,
    results: state.results,
    roadmapFor: state.roadmapFor,
    applyFor: state.applyFor,
    selectedHomeInternship: state.selectedHomeInternship,
    completedCourses: [...state.completedCourses],
    appliedInternships: [...state.appliedInternships],
    applicationDrafts: state.applicationDrafts,
    xp: state.xp,
    activities: state.activities,
    doneSteps: [...state.doneSteps],
  };
}

export default function App() {
  const [state, setState] = useState(loadInitialState);
  const translations = TRANSLATIONS[state.lang] || getFallbackTranslations();

  useEffect(() => {
    Storage.set('appState', serializeState(state));
  }, [state]);

  const stepLabels = translations.steps || getFallbackTranslations().steps;

  const actions = useMemo(() => {
    function setPartial(patch) {
      setState(prev => ({ ...prev, ...patch }));
    }

    function setActiveStepSection(step) {
      setPartial({ currentView: 'candidate', step });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function getCoursesForSkill(skillKey) {
      return STATIC_COURSES[skillKey] || COURSE_TEMPLATES.default(SKILL_LABELS[skillKey] || skillKey);
    }

    function getCourseId(skillKey, title) {
      return `${skillKey}-${title.replace(/\s+/g, '_')}`;
    }

    function prepareResults(rawResults, profile, selectedHomeInternship) {
      return rawResults.map(item => {
        const profileSkills = new Set(profile.skills);
        const skills = item.skills || [];
        const matchedSkills = skills.filter(skill => profileSkills.has(skill));
        const missingSkills = item.missingSkills || skills.filter(skill => !profileSkills.has(skill));
        const skillScore = skills.length ? (matchedSkills.length / skills.length) * 55 : 0;
        const statePref = (profile.state || '').toLowerCase();
        const locationText = `${item.location || ''} ${item.state || ''}`.toLowerCase();
        const locationScore = !statePref ? 8 : locationText.includes(statePref) || locationText.includes('remote') ? 20 : 0;
        const educationScore = (item.education || []).includes(profile.education) ? 15 : 2;
        const sectorScore = profile.sectors.includes(item.sector) ? 10 : 0;
        const experienceScore = ['Fresher', 'Entry-level', '0-1 Years', '0-6 Months'].includes(item.experience) ? 10 : 4;
        const localScore = clamp(Math.round(skillScore + locationScore + educationScore + sectorScore + experienceScore), 5, 100);
        const status = item.status || (missingSkills.length === 0 ? 'eligible' : missingSkills.length <= 2 ? 'near-miss' : 'gap');
        return {
          ...item,
          score: Number.isFinite(item.score) ? item.score : localScore,
          matchedSkills,
          missingSkills,
          status,
        };
      }).sort((a, b) => {
        if (selectedHomeInternship && a.id === selectedHomeInternship) return -1;
        if (selectedHomeInternship && b.id === selectedHomeInternship) return 1;
        return b.score - a.score;
      });
    }

    function addXP(prev, amount, text, color, id) {
      if (prev.activities.find(item => item.id === id)) return prev;
      return {
        ...prev,
        xp: prev.xp + amount,
        activities: [...prev.activities, { id, xp: amount, text, color }],
      };
    }

    return {
      setLang(lang) {
        setPartial({ lang });
      },
      enterCandidateFlow() {
        setPartial({
          currentView: 'candidate',
          step: 1,
          selectedHomeInternship: null,
          roadmapFor: null,
          applyFor: null,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      goHome() {
        setPartial({ currentView: 'home' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      scrollToHomeSection(id) {
        setPartial({ currentView: 'home' });
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      },
      openHomeInternship(id) {
        setPartial({ selectedHomeInternship: id, currentView: 'candidate', step: 1 });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      goStep(step) {
        setActiveStepSection(step);
      },
      updateProfile(key, value) {
        setState(prev => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
      },
      toggleSkill(value) {
        setState(prev => {
          const skills = prev.profile.skills.includes(value)
            ? prev.profile.skills.filter(skill => skill !== value)
            : [...prev.profile.skills, value];
          return { ...prev, profile: { ...prev.profile, skills } };
        });
      },
      toggleSector(value) {
        setState(prev => {
          const sectors = prev.profile.sectors.includes(value)
            ? prev.profile.sectors.filter(sector => sector !== value)
            : [...prev.profile.sectors, value];
          return { ...prev, profile: { ...prev.profile, sectors } };
        });
      },
      async runMatching() {
        const profile = state.profile;
        if (!profile.education || profile.skills.length === 0) {
          showToast('Add education and at least one skill to get strong internship matches.');
          return;
        }

        setState(prev => ({ ...prev, isMatching: true }));
        let rawResults = [];
        try {
          const response = await API.getRecommendations(profile, STATIC_INTERNSHIPS);
          rawResults = response.results || [];
        } catch {
          rawResults = STATIC_INTERNSHIPS;
        }

        setState(prev => {
          const sourceResults = rawResults.length ? [...rawResults] : [...STATIC_INTERNSHIPS];
          if (
            prev.selectedHomeInternship
            && !sourceResults.some(item => item.id === prev.selectedHomeInternship)
          ) {
            const selected = STATIC_INTERNSHIPS.find(item => item.id === prev.selectedHomeInternship);
            if (selected) sourceResults.push(selected);
          }
          const normalized = prepareResults(sourceResults, profile, prev.selectedHomeInternship);
          let next = {
            ...prev,
            profile,
            results: normalized.slice(0, 5),
            doneSteps: new Set([...prev.doneSteps, 1]),
            isMatching: false,
            roadmapFor: null,
            applyFor: null,
          };
          next = addXP(next, 30, 'Created candidate profile', 'green', 'profile_done');

          fireConfetti(24);
          return { ...next, step: 2, currentView: 'candidate' };
        });
      },
      getCoursesForSkill,
      getCourseId,
      getInternshipById(id, sourceState = state) {
        return sourceState.results.find(item => item.id === id) || STATIC_INTERNSHIPS.find(item => item.id === id);
      },
      getInternshipProgress(internship, completedCourses = state.completedCourses) {
        const missingSkills = internship?.missingSkills || [];
        const courseItems = missingSkills.flatMap(skill => getCoursesForSkill(skill).map(course => ({
          id: getCourseId(skill, course.title),
          skill,
        })));
        const done = courseItems.filter(item => completedCourses.has(item.id)).length;
        const total = courseItems.length;
        const percent = total === 0 ? 100 : Math.round((done / total) * 100);
        return { total, done, percent, unlocked: percent === 100, missingSkills };
      },
      getInternshipAction(internship) {
        const progress = actions.getInternshipProgress(internship);
        const applied = state.appliedInternships.has(internship.id);
        if (applied) return { label: 'Applied', className: 'applied', disabled: true };
        if (progress.unlocked) {
          return { label: 'Apply now', className: 'apply', disabled: false, onClick: () => actions.openApplyPage(internship.id) };
        }
        return { label: 'Open roadmap', className: 'roadmap', disabled: false, onClick: () => actions.onRoadmap(internship.id) };
      },
      buildCoachPlan(internship) {
        const progress = actions.getInternshipProgress(internship);
        const plan = progress.missingSkills.map(skill => ({
          skill,
          label: SKILL_LABELS[skill] || skill,
          summary: SKILL_COACH[skill] || 'Build practical confidence through short, focused project work.',
        }));
        return {
          heading: progress.unlocked
            ? `You are now ready to apply for ${internship.title}.`
            : `Here is your roadmap for ${internship.title}.`,
          message: progress.unlocked
            ? 'The application step is unlocked. You can move directly to the application form.'
            : 'The roadmap is mapped from your missing skills into focused learning steps.',
          plan,
        };
      },
      onRoadmap(id) {
        setState(prev => ({
          ...prev,
          roadmapFor: id,
          doneSteps: new Set([...prev.doneSteps, 2]),
          step: 3,
          currentView: 'candidate',
        }));
      },
      markCourse(courseId) {
        setState(prev => {
          if (prev.completedCourses.has(courseId)) return prev;
          const completedCourses = new Set([...prev.completedCourses, courseId]);
          let next = {
            ...prev,
            completedCourses,
            doneSteps: new Set([...prev.doneSteps, 3]),
          };
          next = addXP(next, 25, 'Completed a roadmap step', 'sky', `course_${courseId}`);
          const internship = actions.getInternshipById(prev.roadmapFor, next);
          if (internship && actions.getInternshipProgress(internship, completedCourses).unlocked) {
            next = addXP(next, 100, `Unlocked ${internship.title}`, 'green', `unlock_${internship.id}`);
            showToast('Roadmap complete. Application unlocked.');
          } else {
            showToast('Roadmap step completed');
          }
          return next;
        });
      },
      openApplyPage(id) {
        setState(prev => {
          const internship = actions.getInternshipById(id, prev);
          if (!internship) return prev;
          const progress = actions.getInternshipProgress(internship, prev.completedCourses);
          if (!progress.unlocked || prev.appliedInternships.has(id)) {
            showToast(progress.unlocked ? 'This internship is already applied.' : 'Complete the roadmap to unlock this application.');
            return prev;
          }
          return { ...prev, applyFor: id, doneSteps: new Set([...prev.doneSteps, 4]), step: 5, currentView: 'candidate' };
        });
      },
      updateApplicationDraft(internshipId, key, value) {
        setState(prev => {
          const draft = prev.applicationDrafts[internshipId] || {};
          return {
            ...prev,
            applicationDrafts: {
              ...prev.applicationDrafts,
              [internshipId]: { ...draft, [key]: value },
            },
          };
        });
      },
      captureResume(internshipId, file) {
        if (!file) return;
        actions.updateApplicationDraft(internshipId, 'resumeName', file.name);
        showToast('Resume selected');
      },
      submitApplication(internshipId) {
        setState(prev => {
          const draft = prev.applicationDrafts[internshipId] || {};
          if (!draft.fullName || !draft.email || !draft.phone || !draft.cgpa || !draft.college || !draft.resumeName) {
            showToast('Please complete all required application details and upload your resume.');
            return prev;
          }
          if (prev.appliedInternships.has(internshipId)) return prev;
          const appliedInternships = new Set([...prev.appliedInternships, internshipId]);
          const internship = actions.getInternshipById(internshipId, prev);
          let next = {
            ...prev,
            appliedInternships,
            doneSteps: new Set([...prev.doneSteps, 5]),
            step: 2,
          };
          next = addXP(next, 60, `Applied for ${internship?.title || 'internship'}`, 'green', `apply_${internshipId}`);
          showToast('Application submitted');
          return next;
        });
      },
      getCandidateSummary(sourceState = state) {
        const unlocked = sourceState.results.filter(item => actions.getInternshipProgress(item, sourceState.completedCourses).unlocked).length;
        return { unlocked, applied: sourceState.appliedInternships.size, total: sourceState.results.length };
      },
    };
  }, [state]);

  return (
    <>
      <header className="site-header" role="banner">
        <div className="top-strip">
          <div className="top-strip-inner">
            <p className="top-strip-copy">AI-powered internship discovery, learning roadmaps, and career support for PM Internship Scheme candidates.</p>
            <LanguageToggle languages={LANGUAGES} current={state.lang} onChange={actions.setLang} />
          </div>
        </div>

        <div className="navbar-shell">
          <div className="navbar">
            <button className="brand-block" onClick={actions.goHome} aria-label="Go to PM Internship Scheme home">
              <span className="brand-mark">PM</span>
              <span className="brand-text">
                <strong>{translations.title || 'PM Internship Scheme'}</strong>
                <small>{translations.subtitle || 'Smart discovery for internships and upskilling'}</small>
              </span>
            </button>

            <nav className="main-nav" aria-label="Primary">
              <button className="nav-link" onClick={actions.goHome}>Home</button>
              <button className="nav-link" onClick={() => actions.scrollToHomeSection('about-us')}>About Us</button>
              <button className="nav-link" onClick={() => actions.scrollToHomeSection('contact-us')}>Contact Us</button>
            </nav>

            <div className="nav-actions">
              <button className="btn-nav-secondary" onClick={() => actions.scrollToHomeSection('featured-opportunities')}>Explore Internships</button>
              <button className="btn-nav-primary" onClick={actions.enterCandidateFlow}>Candidate Profile</button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main" role="main">
        <section className="home-view" style={{ display: state.currentView === 'home' ? 'block' : 'none' }}>
          <HomePage
            internships={STATIC_INTERNSHIPS}
            trackLabels={TRACK_LABELS}
            onEnter={actions.enterCandidateFlow}
            onScroll={actions.scrollToHomeSection}
            onOpen={actions.openHomeInternship}
          />
        </section>

        <section className="candidate-view" aria-label="Candidate flow" style={{ display: state.currentView === 'candidate' ? 'block' : 'none' }}>
          <div className="candidate-shell">
            <div className="candidate-shell-top">
              <div className="candidate-copy">
                <span className="candidate-kicker">Candidate Workspace</span>
                <h2>Create your profile and unlock the best-fit internships</h2>
                <p>Build your profile, search internships, close skill gaps, and track progress in one place.</p>
              </div>
              <button className="btn-candidate-back" onClick={actions.goHome}>Back to Home</button>
            </div>

            <StepTabs currentStep={state.step} doneSteps={state.doneSteps} labels={stepLabels} onStep={actions.goStep} />

            <div className="candidate-sections">
              <section className={`section ${state.step === 1 ? 'active' : ''}`} role="tabpanel" aria-label="Profile">
                {state.step === 1 && (
                  <ProfilePage
                    state={state}
                    translations={translations}
                    skillLabels={SKILL_LABELS}
                    trackLabels={TRACK_LABELS}
                    onProfileChange={actions.updateProfile}
                    onToggleSkill={actions.toggleSkill}
                    onToggleSector={actions.toggleSector}
                    onRunMatching={actions.runMatching}
                  />
                )}
              </section>
              <section className={`section ${state.step === 2 ? 'active' : ''}`} role="tabpanel" aria-label="Matches">
                {state.step === 2 && (
                  <MatchesPage
                    state={state}
                    translations={translations}
                    skillLabels={SKILL_LABELS}
                    getSummary={actions.getCandidateSummary}
                    getProgress={actions.getInternshipProgress}
                    getAction={actions.getInternshipAction}
                  />
                )}
              </section>
              <section className={`section ${state.step === 3 ? 'active' : ''}`} role="tabpanel" aria-label="Upskill Roadmap">
                {state.step === 3 && (
                  <RoadmapPage
                    state={state}
                    translations={translations}
                    getInternshipById={actions.getInternshipById}
                    getProgress={actions.getInternshipProgress}
                    buildCoachPlan={actions.buildCoachPlan}
                    getCoursesForSkill={actions.getCoursesForSkill}
                    getCourseId={actions.getCourseId}
                    onMarkCourse={actions.markCourse}
                    onBack={() => actions.goStep(2)}
                    onApply={actions.openApplyPage}
                  />
                )}
              </section>
              <section className={`section ${state.step === 4 ? 'active' : ''}`} role="tabpanel" aria-label="Progress">
                {state.step === 4 && (
                  <ProgressPage state={state} translations={translations} getSummary={actions.getCandidateSummary} getProgress={actions.getInternshipProgress} />
                )}
              </section>
              <section className={`section ${state.step === 5 ? 'active' : ''}`} role="tabpanel" aria-label="Apply">
                {state.step === 5 && (
                  <ApplyPage
                    state={state}
                    getInternshipById={actions.getInternshipById}
                    onBack={() => actions.goStep(2)}
                    onDraftChange={actions.updateApplicationDraft}
                    onResume={actions.captureResume}
                    onSubmit={actions.submitApplication}
                  />
                )}
              </section>
            </div>
          </div>
        </section>
      </main>

      <div id="toast" className="toast" role="status" aria-live="polite" />
    </>
  );
}
