import { useEffect, useState } from 'react';
import { API } from './utils/api.js';
import { Storage } from './utils/storage.js';
import { fireConfetti, showToast } from './utils/helpers.js';
import {
  labelForSkill,
  LANGUAGES,
  LOCATIONS,
  NAV_ITEMS,
  QUALIFICATIONS,
  SKILL_OPTIONS,
  THEMES,
} from './data/catalog.js';

const QUALIFICATION_RANK = {
  class10: 1,
  class12: 2,
  diploma: 3,
  graduation: 4,
  postgrad: 5,
};

const ACADEMIC_SECTIONS = [
  {
    key: 'secondary',
    title: 'Class 10 details',
    minRank: 1,
    fields: [
      { key: 'board', label: 'Board' },
      { key: 'school', label: 'School' },
      { key: 'percentage', label: 'Percentage / CGPA' },
    ],
  },
  {
    key: 'higherSecondary',
    title: 'Class 12 details',
    minRank: 2,
    fields: [
      { key: 'board', label: 'Board' },
      { key: 'school', label: 'School' },
      { key: 'percentage', label: 'Percentage / CGPA' },
    ],
  },
  {
    key: 'diploma',
    title: 'Diploma details',
    minRank: 3,
    onlyFor: ['diploma'],
    fields: [
      { key: 'course', label: 'Diploma course' },
      { key: 'institute', label: 'Institute' },
      { key: 'percentage', label: 'Percentage / CGPA' },
    ],
  },
  {
    key: 'graduation',
    title: 'Graduation details',
    minRank: 4,
    fields: [
      { key: 'degree', label: 'Degree' },
      { key: 'college', label: 'College' },
      { key: 'cgpa', label: 'CGPA' },
    ],
  },
  {
    key: 'postGraduation',
    title: 'Post graduation details',
    minRank: 5,
    fields: [
      { key: 'degree', label: 'Degree' },
      { key: 'college', label: 'College' },
      { key: 'cgpa', label: 'CGPA' },
    ],
  },
];

function readRoute() {
  return window.location.pathname === '/' ? '/qualified' : window.location.pathname;
}

function goTo(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function emptyRegisterForm() {
  return {
    fullName: '',
    email: '',
    password: '',
    phone: '',
    photo: '',
    address: '',
    highestQualification: 'graduation',
    preferredLocations: ['Remote - India'],
    skills: [],
    secondary: { board: '', school: '', percentage: '' },
    higherSecondary: { board: '', school: '', percentage: '' },
    diploma: { course: '', institute: '', percentage: '' },
    graduation: { degree: '', college: '', cgpa: '' },
    postGraduation: { degree: '', college: '', cgpa: '' },
    theme: 'dark',
    language: 'en',
  };
}

function getVisibleAcademicSections(highestQualification) {
  const rank = QUALIFICATION_RANK[highestQualification] || 0;
  return ACADEMIC_SECTIONS.filter(section => {
    if (section.onlyFor) {
      return section.onlyFor.includes(highestQualification);
    }
    return rank >= section.minRank;
  });
}

function sanitizeProfilePayload(form) {
  return {
    ...form,
    preferredLocations: form.preferredLocations?.length ? [form.preferredLocations[0]] : [],
    skills: Array.from(new Set(form.skills || [])),
    secondary: form.secondary || {},
    higherSecondary: form.higherSecondary || {},
    diploma: form.diploma || {},
    graduation: form.graduation || {},
    postGraduation: form.postGraduation || {},
  };
}

function getRecommendedInternships(dashboard) {
  return dashboard.recommended || [];
}

function getNextUnlockedLevel(roadmap) {
  if (!roadmap?.tracks) return null;
  for (const track of roadmap.tracks) {
    const nextLevel = track.levels.find(level => level.unlocked && !level.completed);
    if (nextLevel) {
      return { ...nextLevel, skill: track.skill };
    }
  }
  return null;
}

function getRoadmapProgress(roadmap) {
  if (!roadmap?.tracks?.length) {
    return { completed: 0, total: 0, percent: 0 };
  }
  const allLevels = roadmap.tracks.flatMap(track => track.levels);
  const completed = allLevels.filter(level => level.completed).length;
  const total = allLevels.length;
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

function renderAcademicSections(form, bindNested) {
  return getVisibleAcademicSections(form.highestQualification).map(section => (
    <div className="form-section-card" key={section.key}>
      <div className="form-section-head">
        <h3>{section.title}</h3>
        <p>{section.title} is shown because of the selected highest qualification.</p>
      </div>
      <div className="form-grid compact">
        {section.fields.map(field => (
          <label className="field block" key={`${section.key}-${field.key}`}>
            <span>{field.label}</span>
            <input
              value={form[section.key]?.[field.key] || ''}
              onChange={event => bindNested(section.key, field.key, event.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  ));
}

function ProfileStrength({ form }) {
  return (
    <div className="summary-strip">
      <div className="summary-pill">
        <strong>{form.preferredLocations?.[0] || 'Select one location'}</strong>
        <span>Single preferred location</span>
      </div>
      <div className="summary-pill">
        <strong>{form.highestQualification ? QUALIFICATIONS.find(item => item.value === form.highestQualification)?.label : 'Choose qualification'}</strong>
        <span>Adaptive academic form</span>
      </div>
      <div className="summary-pill">
        <strong>{form.skills?.length || 0} skills</strong>
        <span>Used for internship matching</span>
      </div>
    </div>
  );
}

function DashboardCard({ internship, actionLabel, onAction, actionClass = 'primary', children }) {
  const hasGap = internship.missingSkills?.length > 0;
  return (
    <article className="glass-card internship-card">
      <div className="internship-card-top">
        <div>
          <p className="micro-label">{internship.org}</p>
          <h3>{internship.title}</h3>
        </div>
        <div className="score-badge">{internship.score}% fit</div>
      </div>

      <div className="fit-meta-row">
        <p className="internship-meta">{internship.location} · {internship.jobType} · {internship.stipend}</p>
        <span className={`internship-status-pill ${hasGap ? 'gap' : 'ready'}`}>
          {hasGap ? `${internship.missingSkills.length} skill gap${internship.missingSkills.length === 1 ? '' : 's'}` : 'Apply ready'}
        </span>
      </div>

      <div className="chip-row">
        {(internship.skills || []).slice(0, 5).map(skill => (
          <span key={skill} className="skill-chip">{labelForSkill(skill)}</span>
        ))}
      </div>

      {!!internship.matchedSkills?.length && (
        <p className="success-copy">Matched skills: {internship.matchedSkills.map(labelForSkill).join(', ')}</p>
      )}

      {!!hasGap && (
        <p className="muted-copy">Missing skills: {internship.missingSkills.map(labelForSkill).join(', ')}</p>
      )}

      {children}
      <button className={`action-btn ${actionClass}`} onClick={onAction} type="button">{actionLabel}</button>
    </article>
  );
}

function AuthScreen({ mode, form, setForm, onSubmit, onSwitch, loading }) {
  const subtitle = mode === 'login'
    ? 'Pick up where you left off and refresh your recommendations.'
    : 'Complete one professional registration form, choose one location, and let the portal adapt based on your education and skills.';

  function toggleSkill(skill) {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(item => item !== skill)
        : [...prev.skills, skill],
    }));
  }

  function selectLocation(location) {
    setForm(prev => ({
      ...prev,
      preferredLocations: [location],
    }));
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, photo: String(reader.result || '') }));
    reader.readAsDataURL(file);
  }

  function bindNested(group, key, value) {
    setForm(prev => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  }

  const selectedLocation = form.preferredLocations?.[0] || '';

  return (
    <main className="auth-shell">
      <section className="auth-panel glass-card auth-panel-full">
        <div className="panel-heading auth-panel-head">
          <div>
            <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Professional registration'}</p>
            <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
            <p className="auth-subtitle auth-subtitle-compact">{subtitle}</p>
          </div>
          <button className="text-link" onClick={onSwitch} type="button">
            {mode === 'login' ? 'New here? Register' : 'Already registered? Login'}
          </button>
        </div>

        <div className="form-grid">
          {mode === 'register' && (
            <label className="field block">
              <span>Full name</span>
              <input value={form.fullName} onChange={event => setForm(prev => ({ ...prev, fullName: event.target.value }))} />
            </label>
          )}

          <label className="field block">
            <span>Email</span>
            <input type="email" value={form.email} onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))} />
          </label>

          <label className="field block">
            <span>Password</span>
            <input type="password" value={form.password} onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))} />
          </label>

          {mode === 'register' && (
            <>
              <label className="field block">
                <span>Phone number</span>
                <input value={form.phone} onChange={event => setForm(prev => ({ ...prev, phone: event.target.value }))} />
              </label>

              <label className="field block full">
                <span>Address</span>
                <textarea rows="3" value={form.address} onChange={event => setForm(prev => ({ ...prev, address: event.target.value }))} />
              </label>

              <label className="field block">
                <span>Highest qualification</span>
                <select value={form.highestQualification} onChange={event => setForm(prev => ({ ...prev, highestQualification: event.target.value }))}>
                  {QUALIFICATIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>

              <label className="field block">
                <span>Profile photo</span>
                <input type="file" accept="image/*" onChange={handlePhoto} />
              </label>

              <div className="field full">
                <span className="section-title">Registration summary</span>
                <p className="helper-copy">The form changes as soon as you choose the highest qualification, and you can select only one preferred location.</p>
                <ProfileStrength form={form} />
              </div>

              <div className="field full">
                <span className="section-title">Academic details</span>
                <p className="helper-copy">We only ask for the academic sections needed for the selected education level.</p>
                <div className="academic-section-stack">
                  {renderAcademicSections(form, bindNested)}
                </div>
              </div>

              <div className="field full">
                <span className="section-title">Preferred location</span>
                <p className="helper-copy">Choose one location only. This will influence the internships shown in the portal.</p>
                <div className="location-grid">
                  {LOCATIONS.map(location => (
                    <button
                      key={location}
                      className={`location-card ${selectedLocation === location ? 'selected' : ''}`}
                      type="button"
                      onClick={() => selectLocation(location)}
                    >
                      <strong>{location}</strong>
                      <span>{selectedLocation === location ? 'Selected' : 'Set as preferred location'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field full">
                <span className="section-title">Skills</span>
                <p className="helper-copy">Select the skills you already have. The portal will use these skills to rank five internships for you.</p>
                <div className="chip-row large">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      className={`skill-chip ${form.skills.includes(skill) ? 'selected' : ''}`}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                    >
                      {labelForSkill(skill)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button className="action-btn primary wide" type="button" onClick={onSubmit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Register & Enter Workspace'}
        </button>
      </section>
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState(readRoute());
  const [authLoading, setAuthLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState({ recommended: [], qualified: [], stretch: [], applications: [] });
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [profileDraft, setProfileDraft] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [selectedStretch, setSelectedStretch] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [applyState, setApplyState] = useState({});
  const [applyModalInternship, setApplyModalInternship] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const authMode = route === '/register' ? 'register' : 'login';

  useEffect(() => {
    const onRoute = () => {
      const nextRoute = readRoute();
      if (nextRoute !== '/upskill') {
        setRoadmapData(null);
        setChatMessages([]);
        setChatInput('');
      }
      setRoute(nextRoute);
    };
    window.addEventListener('popstate', onRoute);
    return () => window.removeEventListener('popstate', onRoute);
  }, []);

  useEffect(() => {
    API.me()
      .then(data => {
        const currentRoute = readRoute();
        if (data.authenticated) {
          setUser(data.user);
          setProfileDraft(data.user);
          if (currentRoute === '/login' || currentRoute === '/register') {
            goTo('/qualified');
          }
        } else if (!['/login', '/register'].includes(currentRoute)) {
          goTo('/login');
        }
      })
      .catch(() => {
        const currentRoute = readRoute();
        if (!['/login', '/register'].includes(currentRoute)) {
          goTo('/login');
        }
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.theme) return;
    document.documentElement.dataset.theme = user.theme;
    Storage.set('theme', user.theme);
  }, [user?.theme]);

  useEffect(() => {
    if (!user?.id) return;
    loadDashboard();
  }, [user?.id]);

  function navigate(path) {
    if (path !== '/upskill') {
      setRoadmapData(null);
      setChatMessages([]);
      setChatInput('');
    }
    goTo(path);
  }

  async function loadDashboard() {
    try {
      const data = await API.dashboard();
      setDashboard(data);
      setUser(prev => (prev ? { ...prev, ...data.profile } : data.profile));
      setProfileDraft(data.profile);
      setSelectedStretch(prev => {
        if (!data.stretch.length) return null;
        const stillExists = data.stretch.some(item => item.id === prev);
        return stillExists ? prev : data.stretch[0].id;
      });
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleRegister() {
    setSubmitLoading(true);
    try {
      const payload = sanitizeProfilePayload(registerForm);
      const data = await API.register(payload);
      setUser(data.user);
      setRegisterForm(emptyRegisterForm());
      fireConfetti(32);
      showToast('Profile created');
      navigate('/qualified');
    } catch (error) {
      showToast(error.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleLogin() {
    setSubmitLoading(true);
    try {
      const data = await API.login(loginForm);
      setUser(data.user);
      setProfileDraft(data.user);
      showToast('Welcome back');
      navigate('/qualified');
    } catch (error) {
      showToast(error.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleLogout() {
    await API.logout().catch(() => null);
    setUser(null);
    setDashboard({ recommended: [], qualified: [], stretch: [], applications: [] });
    navigate('/login');
  }

  async function handleRefresh() {
    try {
      const data = await API.refreshRecommendations();
      setDashboard(data);
      setUser(prev => ({ ...prev, ...data.profile }));
      setProfileDraft(data.profile);
      showToast('Recommendation lists refreshed');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleLoadRoadmap(internshipId) {
    const internship = [
      ...(dashboard.recommended || []),
      ...(dashboard.qualified || []),
      ...(dashboard.stretch || []),
    ].find(item => item.id === internshipId);

    if (internship && !internship.missingSkills?.length) {
      showToast('This internship is already ready to apply. No roadmap is needed.');
      openApplyModal(internship);
      return;
    }

    setSelectedStretch(internshipId);
    try {
      const data = await API.getRoadmap(internshipId);
      setRoadmapData(data);
      setChatMessages([
        {
          role: 'assistant',
          text: `I am your roadmap copilot for ${data.internship.title} at ${data.internship.org}. Ask what to learn first, ask for a weekly plan, or say "tick next mission" after you finish a level.`,
        },
      ]);
      goTo('/upskill');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function completeLevel(levelId) {
    if (!roadmapData) return;
    try {
      const data = await API.completeRoadmapLevel(roadmapData.internship.id, levelId);
      setRoadmapData(prev => ({ ...prev, roadmap: data.roadmap }));
      setUser(prev => ({ ...prev, skills: data.skills }));
      setProfileDraft(prev => ({ ...prev, skills: data.skills }));
      await loadDashboard();
      showToast('Mission cleared and progress updated');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function completeNextRoadmapLevel(fromChat = false) {
    const nextLevel = getNextUnlockedLevel(roadmapData?.roadmap);
    if (!nextLevel) {
      showToast('All roadmap missions are already completed for this internship.');
      return;
    }
    await completeLevel(nextLevel.id);
    if (fromChat) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Marked ${nextLevel.topic} under ${labelForSkill(nextLevel.skill)} as completed. Your gamification bar has moved forward.`,
        },
      ]);
    }
  }

  async function saveProfile() {
    try {
      const data = await API.updateProfile(sanitizeProfilePayload(profileDraft));
      setUser(data.profile);
      setProfileDraft(data.profile);
      showToast('Profile updated');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function saveSettings(nextTheme, nextLanguage) {
    try {
      const data = await API.updateSettings({ theme: nextTheme, language: nextLanguage });
      setUser(prev => ({ ...prev, ...data.user }));
      document.documentElement.dataset.theme = data.user.theme;
      Storage.set('theme', data.user.theme);
      showToast('Settings updated');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function applyForInternship(internship) {
    const payload = applyState[internship.id] || {};
    if (!payload.fullName || !payload.email || !payload.resumeName) {
      showToast('Please complete name, email, and resume before applying.');
      return;
    }
    try {
      await API.apply({
        internshipId: internship.id,
        fullName: payload.fullName || user.fullName,
        email: payload.email || user.email,
        githubProfile: payload.githubProfile || '',
        phone: payload.phone || user.phone,
        resumeName: payload.resumeName || '',
        resumeText: payload.resumeText || '',
        coverNote: payload.coverNote || '',
      });
      fireConfetti(20);
      showToast('Application submitted');
      setApplyModalInternship(null);
      await loadDashboard();
    } catch (error) {
      showToast(error.message);
    }
  }

  function openApplyModal(internship) {
    setApplyState(prev => ({
      ...prev,
      [internship.id]: {
        fullName: prev[internship.id]?.fullName || user.fullName || '',
        email: prev[internship.id]?.email || user.email || '',
        phone: prev[internship.id]?.phone || user.phone || '',
        githubProfile: prev[internship.id]?.githubProfile || '',
        resumeName: prev[internship.id]?.resumeName || '',
        resumeText: prev[internship.id]?.resumeText || '',
        coverNote: prev[internship.id]?.coverNote || '',
      },
    }));
    setApplyModalInternship(internship);
  }

  function onResumeSelect(internshipId, file) {
    if (!file) return;
    setApplyState(prev => ({
      ...prev,
      [internshipId]: {
        ...(prev[internshipId] || {}),
        resumeName: file.name,
      },
    }));
  }

  async function sendRoadmapChat(messageText) {
    if (!roadmapData) return;
    const message = messageText.trim();
    if (!message) return;

    const normalized = message.toLowerCase();
    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setChatInput('');

    if (
      normalized.includes('tick next')
      || normalized.includes('mark complete')
      || normalized.includes('mark done')
      || normalized.includes('complete next')
    ) {
      await completeNextRoadmapLevel(true);
      return;
    }

    setChatLoading(true);
    try {
      const data = await API.chatRoadmap(roadmapData.internship.id, message);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', text: data.reply, suggestions: data.suggestions || [] },
      ]);
    } catch (error) {
      showToast(error.message);
    } finally {
      setChatLoading(false);
    }
  }

  function updateProfileField(key, value) {
    setProfileDraft(prev => ({ ...prev, [key]: value }));
  }

  function updateProfileNestedField(group, key, value) {
    setProfileDraft(prev => ({
      ...prev,
      [group]: { ...(prev[group] || {}), [key]: value },
    }));
  }

  function toggleDraftSkill(skill) {
    setProfileDraft(prev => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? prev.skills.filter(item => item !== skill)
        : [...(prev.skills || []), skill],
    }));
  }

  function selectDraftLocation(location) {
    setProfileDraft(prev => ({
      ...prev,
      preferredLocations: [location],
    }));
  }

  if (authLoading) {
    return <div className="screen-loader">Loading workspace...</div>;
  }

  if (!user) {
    return (
      <AuthScreen
        mode={authMode}
        form={authMode === 'login' ? loginForm : registerForm}
        setForm={authMode === 'login' ? setLoginForm : setRegisterForm}
        onSubmit={authMode === 'login' ? handleLogin : handleRegister}
        onSwitch={() => navigate(authMode === 'login' ? '/register' : '/login')}
        loading={submitLoading}
      />
    );
  }

  const applicationsById = Object.fromEntries(dashboard.applications.map(item => [item.internship_id, item]));
  const recommendedInternships = getRecommendedInternships(dashboard);
  const roadmapProgress = getRoadmapProgress(roadmapData?.roadmap);

  return (
    <div className="app-shell">
      <header className="topbar glass-card">
        <button className="brand-lockup" onClick={() => navigate('/qualified')} type="button">
          <span className="brand-orb" />
          <span>
            <strong>PM Internship Engine</strong>
            <small>Skill-aware matching, adaptive forms, and gap roadmaps</small>
          </span>
        </button>

        <nav className="route-tabs">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`route-pill ${route === item.path ? 'active' : ''}`}
              type="button"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="profile-menu-wrap">
          <button className="avatar-button" type="button" onClick={() => setMenuOpen(prev => !prev)}>
            {user.photo ? <img src={user.photo} alt={user.fullName} /> : <span>{(user.fullName || user.email || 'U').slice(0, 1).toUpperCase()}</span>}
          </button>
          {menuOpen && (
            <div className="profile-menu glass-card">
              <button type="button" onClick={() => { navigate('/profile'); setMenuOpen(false); }}>Profile</button>
              <button type="button" onClick={() => { navigate('/settings'); setMenuOpen(false); }}>Settings</button>
              <button type="button" onClick={handleLogout}>Log out</button>
            </div>
          )}
        </div>
      </header>

      <main className="workspace">
        <section className="page-hero glass-card">
          <div>
            <p className="eyebrow">Candidate cockpit</p>
            <h1>{user.fullName || 'Candidate'}</h1>
            <p>
              The portal now ranks five internships from your selected skills and location, and it opens roadmap missions only when there is a real skill gap.
            </p>
          </div>
          <div className="hero-actions">
            <button className="action-btn secondary" type="button" onClick={handleRefresh}>Refresh Lists</button>
            <div className="glass-stat compact">
              <strong>{recommendedInternships.length}</strong>
              <span>top recommendations</span>
            </div>
            <div className="glass-stat compact">
              <strong>{dashboard.stretch.length}</strong>
              <span>roadmap targets</span>
            </div>
          </div>
        </section>

        {route === '/qualified' && (
          <section className="page-grid">
            <div className="panel-stack">
              <div className="panel-heading">
                <h2>Top 5 internships based on your skills</h2>
                <p>
                  Apply-ready roles stay ready to apply. Roles with a skill gap switch to roadmap mode so you only see a learning plan when it is actually required.
                </p>
              </div>

              <div className="summary-strip">
                <div className="summary-pill">
                  <strong>{dashboard.qualified.length}</strong>
                  <span>apply-ready internships</span>
                </div>
                <div className="summary-pill">
                  <strong>{dashboard.stretch.length}</strong>
                  <span>internships needing roadmap</span>
                </div>
                <div className="summary-pill">
                  <strong>{user.preferredLocations?.[0] || 'No location selected'}</strong>
                  <span>current location filter</span>
                </div>
              </div>

              {recommendedInternships.length > 0 ? (
                <div className="card-grid">
                  {recommendedInternships.map(internship => {
                    const hasGap = internship.missingSkills?.length > 0;
                    const isApplied = Boolean(applicationsById[internship.id]);
                    return (
                      <DashboardCard
                        key={internship.id}
                        internship={internship}
                        actionLabel={
                          isApplied
                            ? 'Applied'
                            : hasGap
                              ? 'Open roadmap'
                              : 'Apply now'
                        }
                        onAction={() => {
                          if (isApplied) return;
                          if (hasGap) {
                            handleLoadRoadmap(internship.id);
                            return;
                          }
                          openApplyModal(internship);
                        }}
                        actionClass={isApplied ? 'disabled' : hasGap ? 'secondary' : 'primary'}
                      >
                        {isApplied && (
                          <p className="success-copy">Submitted on {new Date(applicationsById[internship.id].applied_at).toLocaleDateString('en-IN')}</p>
                        )}
                      </DashboardCard>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state glass-card">
                  <h3>No internships match this profile yet</h3>
                  <p>Try adding more skills or changing the preferred location to unlock stronger results.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {route === '/upskill' && (
          <section className="dual-layout">
            <div className="stretch-list glass-card">
              <div className="panel-heading">
                <h2>Skill-gap roadmap arena</h2>
                <p>Only internships with at least one missing skill appear here.</p>
              </div>
              {dashboard.stretch.length === 0 ? (
                <div className="empty-state">
                  <h3>No roadmap needed right now</h3>
                  <p>Your current profile is already aligned with the available apply-ready internships.</p>
                </div>
              ) : (
                <div className="stack-list">
                  {dashboard.stretch.map(internship => (
                    <button
                      key={internship.id}
                      className={`stretch-item ${selectedStretch === internship.id ? 'active' : ''}`}
                      type="button"
                      onClick={() => handleLoadRoadmap(internship.id)}
                    >
                      <span>
                        <strong>{internship.title}</strong>
                        <small>{internship.org}</small>
                      </span>
                      <em>{internship.missingSkills.length} skills missing</em>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="roadmap-arena glass-card">
              {!roadmapData && (
                <div className="placeholder-copy">
                  Select a skill-gap internship to open the roadmap and chatbot.
                </div>
              )}

              {roadmapData && (
                <>
                  <div className="arena-top">
                    <div>
                      <p className="eyebrow">Roadmap Arena</p>
                      <h2>{roadmapData.internship.title}</h2>
                      <p>{roadmapData.internship.org} · {roadmapData.internship.location}</p>
                    </div>
                    <button className="action-btn secondary" type="button" onClick={handleRefresh}>Recalculate buckets</button>
                  </div>

                  <div className="gamification-panel">
                    <div>
                      <p className="eyebrow">Gamification bar</p>
                      <h3>{roadmapProgress.completed} of {roadmapProgress.total} missions completed</h3>
                    </div>
                    <div className="progress-meter">
                      <div className="progress-meter-bar" style={{ width: `${roadmapProgress.percent}%` }} />
                    </div>
                    <p className="muted-copy">Ask the chatbot for the next step, then tick the completed mission to move this bar forward.</p>
                  </div>

                  <div className="chatbot-panel chatbot-panel-top">
                    <div className="chatbot-panel-head">
                      <div className="panel-heading compact">
                        <h2>AI Roadmap Copilot</h2>
                        <p>The chatbot focuses only on the missing skills for this internship.</p>
                      </div>
                      <div className="chatbot-badge">Roadmap chat</div>
                    </div>
                    <div className="chat-shell">
                      <div className="chat-log">
                        {chatMessages.map((message, index) => (
                          <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                            <span className="chat-role">{message.role === 'assistant' ? 'Copilot' : 'You'}</span>
                            <p>{message.text}</p>
                            {message.suggestions?.length > 0 && (
                              <div className="chat-suggestions">
                                {message.suggestions.map(suggestion => (
                                  <button
                                    key={suggestion}
                                    type="button"
                                    className="skill-chip"
                                    onClick={() => sendRoadmapChat(suggestion)}
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="chat-bubble assistant">
                            <span className="chat-role">Copilot</span>
                            <p>Thinking through your roadmap...</p>
                          </div>
                        )}
                      </div>
                      <div className="chat-compose">
                        <input
                          value={chatInput}
                          onChange={event => setChatInput(event.target.value)}
                          placeholder='Ask: what should I learn first? or type "tick next mission"'
                          onKeyDown={event => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              sendRoadmapChat(chatInput);
                            }
                          }}
                        />
                        <button className="action-btn secondary" type="button" onClick={() => completeNextRoadmapLevel(true)}>
                          Tick next mission
                        </button>
                        <button className="action-btn primary" type="button" onClick={() => sendRoadmapChat(chatInput)} disabled={chatLoading}>
                          Send
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="tracks-grid">
                    {roadmapData.roadmap.tracks.map(track => {
                      const completedCount = track.levels.filter(level => level.completed).length;
                      const progress = Math.round((completedCount / track.levels.length) * 100);
                      return (
                        <div key={track.skill} className="track-card">
                          <div className="track-header">
                            <div>
                              <h3>{labelForSkill(track.skill)}</h3>
                              <p>{progress}% complete</p>
                            </div>
                            <div className="xp-ring">{progress}%</div>
                          </div>
                          <div className="level-stack">
                            {track.levels.map(level => (
                              <div key={level.id} className={`level-row ${level.completed ? 'done' : level.unlocked ? 'open' : 'locked'}`}>
                                <div className="level-row-body">
                                  <span>{level.label}</span>
                                  <strong>{level.topic}</strong>
                                </div>
                                <button
                                  type="button"
                                  className={`mission-check ${level.completed ? 'checked' : ''}`}
                                  disabled={!level.unlocked || level.completed}
                                  onClick={() => completeLevel(level.id)}
                                  aria-label={level.completed ? `${level.topic} completed` : `Tick ${level.topic} as complete`}
                                >
                                  {level.completed ? 'Ticked' : 'Tick mission'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {route === '/profile' && profileDraft && (
          <section className="profile-layout glass-card">
            <div className="profile-hero">
              <div className="profile-avatar">
                {profileDraft.photo ? <img src={profileDraft.photo} alt={profileDraft.fullName} /> : <span>{(profileDraft.fullName || 'P').slice(0, 1).toUpperCase()}</span>}
              </div>
              <div>
                <h2>{profileDraft.fullName}</h2>
                <p>{profileDraft.email}</p>
              </div>
            </div>

            <ProfileStrength form={profileDraft} />

            <div className="form-grid">
              <label className="field block">
                <span>Full name</span>
                <input value={profileDraft.fullName || ''} onChange={event => updateProfileField('fullName', event.target.value)} />
              </label>
              <label className="field block">
                <span>Phone</span>
                <input value={profileDraft.phone || ''} onChange={event => updateProfileField('phone', event.target.value)} />
              </label>
              <label className="field block full">
                <span>Address</span>
                <textarea rows="3" value={profileDraft.address || ''} onChange={event => updateProfileField('address', event.target.value)} />
              </label>
              <label className="field block">
                <span>Highest qualification</span>
                <select value={profileDraft.highestQualification || 'graduation'} onChange={event => updateProfileField('highestQualification', event.target.value)}>
                  {QUALIFICATIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <div className="field block full">
                <span>Preferred location</span>
                <div className="location-grid profile-location-grid">
                  {LOCATIONS.map(location => (
                    <button
                      key={location}
                      type="button"
                      className={`location-card ${(profileDraft.preferredLocations || [])[0] === location ? 'selected' : ''}`}
                      onClick={() => selectDraftLocation(location)}
                    >
                      <strong>{location}</strong>
                      <span>{(profileDraft.preferredLocations || [])[0] === location ? 'Selected' : 'Set as preferred location'}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="field block full">
                <span>Academic details</span>
                <div className="academic-section-stack">
                  {renderAcademicSections(profileDraft, updateProfileNestedField)}
                </div>
              </div>
              <div className="field block full">
                <span>Skills</span>
                <div className="chip-row large">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      className={`skill-chip ${profileDraft.skills?.includes(skill) ? 'selected' : ''}`}
                      type="button"
                      onClick={() => toggleDraftSkill(skill)}
                    >
                      {labelForSkill(skill)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button className="action-btn primary" type="button" onClick={saveProfile}>Save profile changes</button>
          </section>
        )}

        {route === '/settings' && (
          <section className="settings-layout glass-card">
            <div className="panel-heading">
              <h2>Settings</h2>
              <p>Adjust language and theme for the profile and dashboard experience.</p>
            </div>
            <div className="form-grid">
              <label className="field block">
                <span>Theme</span>
                <select value={user.theme || 'dark'} onChange={event => saveSettings(event.target.value, user.language || 'en')}>
                  {THEMES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="field block">
                <span>Language</span>
                <select value={user.language || 'en'} onChange={event => saveSettings(user.theme || 'dark', event.target.value)}>
                  {LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
                </select>
              </label>
            </div>
          </section>
        )}
      </main>

      {applyModalInternship && (
        <div className="modal-backdrop" onClick={() => setApplyModalInternship(null)}>
          <div className="apply-modal glass-card" onClick={event => event.stopPropagation()}>
            <div className="panel-heading">
              <h2>Apply for {applyModalInternship.title}</h2>
              <p>{applyModalInternship.org} · Fill in the required details before submission.</p>
            </div>

            <div className="form-grid">
              <label className="field block">
                <span>Full name</span>
                <input
                  value={applyState[applyModalInternship.id]?.fullName || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), fullName: event.target.value },
                  }))}
                />
              </label>
              <label className="field block">
                <span>Email ID</span>
                <input
                  type="email"
                  value={applyState[applyModalInternship.id]?.email || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), email: event.target.value },
                  }))}
                />
              </label>
              <label className="field block">
                <span>Phone</span>
                <input
                  value={applyState[applyModalInternship.id]?.phone || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), phone: event.target.value },
                  }))}
                />
              </label>
              <label className="field block">
                <span>GitHub profile</span>
                <input
                  placeholder="https://github.com/yourname"
                  value={applyState[applyModalInternship.id]?.githubProfile || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), githubProfile: event.target.value },
                  }))}
                />
              </label>
              <label className="field block full">
                <span>Upload resume</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={event => onResumeSelect(applyModalInternship.id, event.target.files?.[0])} />
                {applyState[applyModalInternship.id]?.resumeName && (
                  <p className="muted-copy resume-label">Selected: {applyState[applyModalInternship.id].resumeName}</p>
                )}
              </label>
              <label className="field block full">
                <span>Resume summary</span>
                <textarea
                  rows="3"
                  placeholder="Short highlights from your resume"
                  value={applyState[applyModalInternship.id]?.resumeText || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), resumeText: event.target.value },
                  }))}
                />
              </label>
              <label className="field block full">
                <span>Short note</span>
                <textarea
                  rows="3"
                  placeholder="Why are you a good fit for this internship?"
                  value={applyState[applyModalInternship.id]?.coverNote || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), coverNote: event.target.value },
                  }))}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="action-btn secondary" type="button" onClick={() => setApplyModalInternship(null)}>
                Cancel
              </button>
              <button className="action-btn primary" type="button" onClick={() => applyForInternship(applyModalInternship)}>
                Submit application
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="toast" className="toast" role="status" aria-live="polite" />
    </div>
  );
}
