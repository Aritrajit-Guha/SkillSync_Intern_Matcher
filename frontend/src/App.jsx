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
    graduation: { degree: '', college: '', cgpa: '' },
    postGraduation: { degree: '', college: '', cgpa: '' },
    theme: 'dark',
    language: 'en',
  };
}

function DashboardCard({ internship, actionLabel, onAction, actionClass = 'primary', children }) {
  return (
    <article className="glass-card internship-card">
      <div className="internship-card-top">
        <div>
          <p className="micro-label">{internship.org}</p>
          <h3>{internship.title}</h3>
        </div>
        <div className="score-badge">{internship.score}% fit</div>
      </div>
      <p className="internship-meta">{internship.location} · {internship.jobType} · {internship.stipend}</p>
      <div className="chip-row">
        {(internship.skills || []).slice(0, 5).map(skill => (
          <span key={skill} className="skill-chip">{labelForSkill(skill)}</span>
        ))}
      </div>
      {!!internship.missingSkills?.length && (
        <p className="muted-copy">Missing: {internship.missingSkills.map(labelForSkill).join(', ')}</p>
      )}
      {children}
      <button className={`action-btn ${actionClass}`} onClick={onAction} type="button">{actionLabel}</button>
    </article>
  );
}

function AuthScreen({ mode, form, setForm, onSubmit, onSwitch, loading }) {
  const title = mode === 'login' ? 'Log in to your candidate command center' : 'Create your internship-ready profile';
  const subtitle = mode === 'login'
    ? 'Pick up where you left off and refresh your recommendations.'
    : 'Register once with the details normally needed across national internship portals.';

  function toggleSkill(skill) {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(item => item !== skill)
        : [...prev.skills, skill],
    }));
  }

  function toggleLocation(location) {
    setForm(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.includes(location)
        ? prev.preferredLocations.filter(item => item !== location)
        : [...prev.preferredLocations, location],
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

  return (
    <main className="auth-shell">
      <section className="hero-panel">
        <p className="eyebrow">PM Internship Engine</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="hero-grid-mini">
          <div className="glass-stat">
            <strong>2 Buckets</strong>
            <span>safe matches + stretch matches</span>
          </div>
          <div className="glass-stat">
            <strong>Game Roadmaps</strong>
            <span>clear levels and unlock new roles</span>
          </div>
          <div className="glass-stat">
            <strong>Profile Memory</strong>
            <span>photo, academics, skills, settings</span>
          </div>
        </div>
      </section>

      <section className="auth-panel glass-card">
        <div className="panel-heading">
          <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
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

              <div className="full">
                <p className="section-title">Academic details</p>
                <div className="form-grid">
                  <label className="field block">
                    <span>10th board</span>
                    <input value={form.secondary.board} onChange={event => bindNested('secondary', 'board', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>10th school</span>
                    <input value={form.secondary.school} onChange={event => bindNested('secondary', 'school', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>10th percentage</span>
                    <input value={form.secondary.percentage} onChange={event => bindNested('secondary', 'percentage', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>12th board</span>
                    <input value={form.higherSecondary.board} onChange={event => bindNested('higherSecondary', 'board', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>12th school</span>
                    <input value={form.higherSecondary.school} onChange={event => bindNested('higherSecondary', 'school', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>12th percentage</span>
                    <input value={form.higherSecondary.percentage} onChange={event => bindNested('higherSecondary', 'percentage', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>Graduation degree</span>
                    <input value={form.graduation.degree} onChange={event => bindNested('graduation', 'degree', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>Graduation college</span>
                    <input value={form.graduation.college} onChange={event => bindNested('graduation', 'college', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>Graduation CGPA</span>
                    <input value={form.graduation.cgpa} onChange={event => bindNested('graduation', 'cgpa', event.target.value)} />
                  </label>
                </div>
              </div>

              <div className="full">
                <p className="section-title">Preferred locations</p>
                <div className="chip-row large">
                  {LOCATIONS.map(location => (
                    <button
                      key={location}
                      className={`skill-chip ${form.preferredLocations.includes(location) ? 'selected' : ''}`}
                      type="button"
                      onClick={() => toggleLocation(location)}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>

              <div className="full">
                <p className="section-title">Skills</p>
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
  const [authMode, setAuthMode] = useState(route === '/register' ? 'register' : 'login');
  const [authLoading, setAuthLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState({ qualified: [], stretch: [], applications: [] });
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

  useEffect(() => {
    const onRoute = () => setRoute(readRoute());
    window.addEventListener('popstate', onRoute);
    return () => window.removeEventListener('popstate', onRoute);
  }, []);

  useEffect(() => {
    setAuthMode(route === '/register' ? 'register' : 'login');
  }, [route]);

  useEffect(() => {
    API.me()
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
          setProfileDraft(data.user);
          if (route === '/login' || route === '/register') {
            goTo('/qualified');
          }
        } else if (!['/login', '/register'].includes(route)) {
          goTo('/login');
        }
      })
      .catch(() => {
        if (!['/login', '/register'].includes(route)) {
          goTo('/login');
        }
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileDraft(user);
    document.documentElement.dataset.theme = user.theme || Storage.get('theme', 'dark');
    Storage.set('theme', user.theme || 'dark');
    loadDashboard();
  }, [user]);

  useEffect(() => {
    if (route !== '/upskill') {
      setRoadmapData(null);
      setChatMessages([]);
      setChatInput('');
    }
  }, [route]);

  async function loadDashboard() {
    try {
      const data = await API.dashboard();
      setDashboard(data);
      setUser(data.profile);
      if (!selectedStretch && data.stretch.length) {
        setSelectedStretch(data.stretch[0].id);
      }
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleRegister() {
    setSubmitLoading(true);
    try {
      const payload = { ...registerForm };
      const data = await API.register(payload);
      setUser(data.user);
      fireConfetti(32);
      showToast('Profile created');
      goTo('/qualified');
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
      showToast('Welcome back');
      goTo('/qualified');
    } catch (error) {
      showToast(error.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleLogout() {
    await API.logout().catch(() => null);
    setUser(null);
    setDashboard({ qualified: [], stretch: [], applications: [] });
    goTo('/login');
  }

  async function handleRefresh() {
    try {
      const data = await API.refreshRecommendations();
      setDashboard(data);
      setUser(data.profile);
      showToast('Recommendation lists refreshed');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleLoadRoadmap(internshipId) {
    setSelectedStretch(internshipId);
    try {
      const data = await API.getRoadmap(internshipId);
      setRoadmapData(data);
      setChatMessages([
        {
          role: 'assistant',
          text: `I am your roadmap copilot for ${data.internship.title} at ${data.internship.org}. Ask me what to learn first, how to plan your weeks, or explain the missing skills in simple words.`,
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
      await loadDashboard();
      showToast('Level cleared');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function saveProfile() {
    try {
      const data = await API.updateProfile(profileDraft);
      setUser(data.profile);
      showToast('Profile updated');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function saveSettings(nextTheme, nextLanguage) {
    try {
      const data = await API.updateSettings({ theme: nextTheme, language: nextLanguage });
      setUser(data.user);
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

    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setChatInput('');
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

  function toggleDraftSkill(skill) {
    setProfileDraft(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(item => item !== skill)
        : [...prev.skills, skill],
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
        onSwitch={() => goTo(authMode === 'login' ? '/register' : '/login')}
        loading={submitLoading}
      />
    );
  }

  const applicationsById = Object.fromEntries(dashboard.applications.map(item => [item.internship_id, item]));

  return (
    <div className="app-shell">
      <header className="topbar glass-card">
        <button className="brand-lockup" onClick={() => goTo('/qualified')} type="button">
          <span className="brand-orb" />
          <span>
            <strong>PM Internship Engine</strong>
            <small>Dataset-powered matching and skill unlocks</small>
          </span>
        </button>

        <nav className="route-tabs">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`route-pill ${route === item.path ? 'active' : ''}`}
              type="button"
              onClick={() => goTo(item.path)}
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
              <button type="button" onClick={() => { goTo('/profile'); setMenuOpen(false); }}>Profile</button>
              <button type="button" onClick={() => { goTo('/settings'); setMenuOpen(false); }}>Settings</button>
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
              Your profile is connected to a sample internship dataset now, with room to plug in portal APIs and geocoding later.
            </p>
          </div>
          <div className="hero-actions">
            <button className="action-btn secondary" type="button" onClick={handleRefresh}>Refresh Lists</button>
            <div className="glass-stat compact">
              <strong>{dashboard.qualified.length}</strong>
              <span>qualified now</span>
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
                <h2>Top 5 best-fit internships</h2>
                <p>These are the roles you already qualify for based on your current profile and skills.</p>
              </div>
              {dashboard.qualified.length > 0 ? (
                <div className="card-grid">
                  {dashboard.qualified.map(internship => (
                    <DashboardCard
                      key={internship.id}
                      internship={internship}
                      actionLabel={applicationsById[internship.id] ? 'Applied' : 'Apply now'}
                      onAction={() => !applicationsById[internship.id] && openApplyModal(internship)}
                      actionClass={applicationsById[internship.id] ? 'disabled' : 'primary'}
                    >
                      {applicationsById[internship.id] && (
                        <p className="success-copy">Submitted on {new Date(applicationsById[internship.id].applied_at).toLocaleDateString('en-IN')}</p>
                      )}
                    </DashboardCard>
                  ))}
                </div>
              ) : (
                <div className="empty-state glass-card">
                  <h3>No fully qualified internships yet</h3>
                  <p>
                    You are close though. We found {dashboard.stretch.length} roadmap target{dashboard.stretch.length === 1 ? '' : 's'}
                    {' '}where you only need a few more skills.
                  </p>
                  <div className="empty-state-actions">
                    <button className="action-btn primary" type="button" onClick={() => goTo('/upskill')}>
                      View {dashboard.stretch.length} roadmap target{dashboard.stretch.length === 1 ? '' : 's'}
                    </button>
                    <button className="action-btn secondary" type="button" onClick={handleRefresh}>
                      Refresh Lists
                    </button>
                  </div>

                  {dashboard.stretch.length > 0 && (
                    <>
                      <div className="panel-heading inline-gap">
                        <h2>Closest opportunities right now</h2>
                        <p>Open any one of these and start the game-style roadmap.</p>
                      </div>
                      <div className="card-grid">
                        {dashboard.stretch.map(internship => (
                          <DashboardCard
                            key={internship.id}
                            internship={internship}
                            actionLabel="Open roadmap"
                            onAction={() => handleLoadRoadmap(internship.id)}
                            actionClass="secondary"
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {route === '/upskill' && (
          <section className="dual-layout">
            <div className="stretch-list glass-card">
              <div className="panel-heading">
                <h2>Near-match arena</h2>
                <p>These are stronger roles where you are short by only 1 to 3 skills.</p>
              </div>
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
            </div>

            <div className="roadmap-arena glass-card">
              {!roadmapData && <p className="placeholder-copy">Select a near-match internship to open the futuristic roadmap arena.</p>}
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

                  <div className="chatbot-panel chatbot-panel-top">
                    <div className="chatbot-panel-head">
                      <div className="panel-heading compact">
                        <h2>AI Roadmap Copilot</h2>
                        <p>Ask first, then follow the missions below. The copilot answers for this internship only.</p>
                      </div>
                      <div className="chatbot-badge">Live roadmap chat</div>
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
                          placeholder="Ask: what should I learn first for this internship?"
                          onKeyDown={event => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              sendRoadmapChat(chatInput);
                            }
                          }}
                        />
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
                                <div>
                                  <span>{level.label}</span>
                                  <strong>{level.topic}</strong>
                                </div>
                                <button
                                  type="button"
                                  className="action-btn tertiary"
                                  disabled={!level.unlocked || level.completed}
                                  onClick={() => completeLevel(level.id)}
                                >
                                  {level.completed ? 'Cleared' : 'Mark complete'}
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
              <p>Adjust language and theme from the profile menu flow you described.</p>
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
