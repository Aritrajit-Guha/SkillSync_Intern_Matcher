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
  SKILL_LABELS,
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

const DOCUMENT_LABELS = {
  resume: 'Resume',
  secondary: 'Class 10 marksheet',
  higherSecondary: 'Class 12 marksheet',
  diploma: 'Diploma marksheet',
  graduation: 'Graduation marksheet',
  postGraduation: 'Post graduation marksheet',
};

function readRoute() {
  const path = window.location.pathname === '/' ? '/home' : window.location.pathname;
  return path === '/qualified' ? '/ready-matches' : path;
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
    aadhaarNumber: '',
    address: '',
    socialLinks: { github: '', linkedin: '' },
    documents: {},
    documentFiles: {},
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

function getRequiredDocumentKinds(highestQualification) {
  return ['resume', ...getVisibleAcademicSections(highestQualification).map(section => section.key)];
}

function getDocumentName(form, kind) {
  return form?.documentFiles?.[kind]?.name || form?.documents?.[kind]?.originalName || '';
}

function hasDocument(form, kind) {
  return Boolean(getDocumentName(form, kind));
}

function maskAadhaar(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : 'Not added';
}

function isValidAadhaar(value) {
  return String(value || '').replace(/\D/g, '').length === 12;
}

function getGithubUsername(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  const normalized = value.includes('github.com') ? value : `https://github.com/${value}`;
  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname.includes('github.com')) return '';
    return parsed.pathname.split('/').filter(Boolean)[0] || '';
  } catch {
    return value.replace(/^@/, '').split('/').filter(Boolean)[0] || '';
  }
}

function buildRegistrationFormData(form) {
  const payload = sanitizeProfilePayload(form);
  delete payload.documentFiles;
  const body = new FormData();
  body.append('profile', JSON.stringify(payload));
  for (const kind of getRequiredDocumentKinds(form.highestQualification)) {
    const file = form.documentFiles?.[kind];
    if (file) body.append(kind, file);
  }
  return body;
}

function sanitizeProfilePayload(form) {
  return {
    ...form,
    documentFiles: undefined,
    aadhaarNumber: String(form.aadhaarNumber || '').replace(/\D/g, ''),
    socialLinks: {
      github: form.socialLinks?.github || '',
      linkedin: form.socialLinks?.linkedin || '',
    },
    documents: form.documents || {},
    preferredLocations: form.preferredLocations?.length ? [form.preferredLocations[0]] : [],
    skills: Array.from(new Set(form.skills || [])),
    secondary: form.secondary || {},
    higherSecondary: form.higherSecondary || {},
    diploma: form.diploma || {},
    graduation: form.graduation || {},
    postGraduation: form.postGraduation || {},
  };
}

function getRegistrationMissingItems(form) {
  const missing = [];
  if (!form.fullName?.trim()) missing.push('Full name');
  if (!form.email?.trim()) missing.push('Email');
  if (!form.password?.trim()) missing.push('Password');
  if (!form.phone?.trim()) missing.push('Phone number');
  if (!isValidAadhaar(form.aadhaarNumber)) missing.push('Valid 12-digit Aadhaar number');
  if (!form.address?.trim()) missing.push('Address');
  if (!form.highestQualification) missing.push('Highest qualification');
  if (!form.preferredLocations?.[0]) missing.push('Preferred location');
  if (!(form.skills || []).length) missing.push('At least one skill');
  for (const kind of getRequiredDocumentKinds(form.highestQualification)) {
    if (!hasDocument(form, kind)) missing.push(DOCUMENT_LABELS[kind]);
  }
  const visibleSections = getVisibleAcademicSections(form.highestQualification);
  for (const section of visibleSections) {
    for (const field of section.fields) {
      const value = form?.[section.key]?.[field.key];
      if (!String(value || '').trim()) missing.push(`${section.title}: ${field.label}`);
    }
  }
  return missing;
}

function formatMissingItems(missing) {
  if (!missing.length) return '';
  if (missing.length <= 4) {
    return `Please complete: ${missing.join(', ')}.`;
  }
  return `Please complete: ${missing.slice(0, 4).join(', ')} and ${missing.length - 4} more.`;
}

const EMPTY_DASHBOARD = {
  catalog: [],
  recommended: [],
  qualified: [],
  stretch: [],
  readyMatches: [],
  growthPicks: [],
  applications: [],
};

const EMPTY_PREFERENCES = {
  domain: 'any',
  desiredLocation: '',
  jobType: 'any',
  stipendPreference: 'Any',
  experiencePreference: 'Any',
  experienceAmount: '',
};

const EMPTY_HOME_FILTERS = {
  domain: 'all',
  location: 'all',
  jobType: 'all',
  experience: 'all',
  stipendType: 'all',
  fit: 'all',
};

const ROADMAP_SESSION_KEY = 'active_roadmap_context';

function getStoredRoadmapContext() {
  const context = Storage.get(ROADMAP_SESSION_KEY, null);
  if (!context || typeof context !== 'object' || !context.internshipId || !context.skill) {
    return null;
  }
  return context;
}

function normalizeDashboard(data = {}) {
  return {
    ...EMPTY_DASHBOARD,
    ...data,
    catalog: data.catalog || [],
    recommended: data.recommended || data.readyMatches || [],
    qualified: data.qualified || data.readyMatches || [],
    stretch: data.stretch || data.growthPicks || [],
    readyMatches: data.readyMatches || data.qualified || [],
    growthPicks: data.growthPicks || data.stretch || [],
    applications: data.applications || [],
  };
}

function getStipendType(internship) {
  const amount = Number(internship?.stipendAmount || 0);
  const text = String(internship?.stipend || '').toLowerCase();
  return amount > 0 && !text.includes('performance') && !text.includes('free') ? 'paid' : 'free';
}

function getFitLabel(internship) {
  const missing = internship?.missingSkills?.length || 0;
  const score = internship?.score || 0;
  if (!missing && score >= 78) return 'Highly aligned';
  if (!missing) return 'Good fit';
  if (missing <= 2) return 'Stretch';
  return 'Not ideal';
}

function logGeminiRoadmapDebug(data, context = 'roadmap') {
  const raw = data?.roadmap?.rawPreview;
  if (!raw) return;
  console.groupCollapsed(`[SkillSync] Gemini raw response (${context})`);
  console.log('source:', data.roadmap.source);
  console.log('sourceDetail:', data.roadmap.sourceDetail || '');
  console.log('skill:', data.skill);
  try {
    console.log('payload:', JSON.parse(raw));
  } catch {
    console.log('payload:', raw);
  }
  console.groupEnd();
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

function getXpBadge(progress) {
  const xp = progress.completed * 10;
  if (xp >= 120) return { xp, badge: 'Gold' };
  if (xp >= 60) return { xp, badge: 'Silver' };
  return { xp, badge: 'Bronze' };
}

function renderDocumentPicker(form, kind, onDocumentSelect, disabled = false) {
  return (
    <label className="field block full document-picker">
      <span>{DOCUMENT_LABELS[kind]} *</span>
      <input
        type="file"
        accept={kind === 'resume' ? '.pdf,.doc,.docx' : '.pdf,.jpg,.jpeg,.png'}
        disabled={disabled}
        onChange={event => onDocumentSelect?.(kind, event.target.files?.[0])}
      />
      <p className="muted-copy resume-label">
        {getDocumentName(form, kind) ? `Selected: ${getDocumentName(form, kind)}` : 'No file selected yet.'}
      </p>
    </label>
  );
}

function renderAcademicSections(form, bindNested, options = {}) {
  const { showDocuments = false, onDocumentSelect, disabled = false } = options;
  return getVisibleAcademicSections(form.highestQualification).map(section => (
    <div className="form-section-card" key={section.key}>
      <div className="form-section-head">
        <h3>{section.title}</h3>
        <p>{section.title} is shown because of the selected highest qualification.</p>
      </div>
      <div className="form-grid compact">
        {section.fields.map(field => (
          <label className="field block" key={`${section.key}-${field.key}`}>
            <span>{field.label} *</span>
            <input
              disabled={disabled}
              value={form[section.key]?.[field.key] || ''}
              onChange={event => bindNested(section.key, field.key, event.target.value)}
            />
          </label>
        ))}
        {showDocuments && renderDocumentPicker(form, section.key, onDocumentSelect, disabled)}
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

function DashboardCard({ internship, actionLabel, onAction, actionClass = 'primary', skillLabels = {}, children }) {
  const skillName = skill => skillLabels[skill] || labelForSkill(skill);
  const hasGap = internship.missingSkills?.length > 0;
  const fitLabel = getFitLabel(internship);
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
        <p className="internship-meta">{internship.location} - {internship.jobType} - {internship.stipend}</p>
        <span className={`internship-status-pill ${hasGap ? 'gap' : 'ready'}`}>
          {hasGap ? `${internship.missingSkills.length} skill gap${internship.missingSkills.length === 1 ? '' : 's'}` : fitLabel}
        </span>
      </div>

      <div className="chip-row">
        {(internship.skills || []).slice(0, 5).map(skill => (
          <span key={skill} className="skill-chip">{skillName(skill)}</span>
        ))}
      </div>

      {!!internship.matchedSkills?.length && (
        <p className="success-copy">Matched skills: {internship.matchedSkills.map(skillName).join(', ')}</p>
      )}

      {!!hasGap && (
        <p className="muted-copy">Missing skills: {internship.missingSkills.map(skillName).join(', ')}</p>
      )}

      {children}
      {internship.scoreBreakdown && (
        <p className="muted-copy">
          Score factors: skill {Math.round(internship.scoreBreakdown.skill)}, quality {Math.round(internship.scoreBreakdown.quality)}, location {Math.round(internship.scoreBreakdown.location)}
        </p>
      )}
      {actionLabel && (
        <button className={`action-btn ${actionClass}`} onClick={onAction} type="button">{actionLabel}</button>
      )}
    </article>
  );
}

function AuthScreen({
  mode,
  form,
  setForm,
  onSubmit,
  onSwitch,
  loading,
  onUseCurrentLocation,
  skillOptions,
  skillLabels,
  locationOptions,
}) {
  const skillName = skill => skillLabels[skill] || labelForSkill(skill);
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

  function handleRegisterDocumentSelect(kind, file) {
    if (!file) return;
    setForm(prev => ({
      ...prev,
      documentFiles: { ...(prev.documentFiles || {}), [kind]: file },
      documents: {
        ...(prev.documents || {}),
        [kind]: {
          kind,
          originalName: file.name,
          size: file.size,
          contentType: file.type,
        },
      },
    }));
  }

  function bindNested(group, key, value) {
    setForm(prev => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  }

  const selectedLocation = form.preferredLocations?.[0] || '';

  async function handleForgotPassword() {
    if (!form.email?.trim()) {
      showToast('Enter your email first, then click Forgot password.');
      return;
    }
    try {
      const result = await API.forgotPassword(form.email.trim());
      showToast(result.message || 'Reset instructions sent.');
    } catch (error) {
      showToast(error.message || 'Could not start password reset.');
    }
  }

  function handleGoogleContinue() {
    window.open('https://accounts.google.com/signin', '_blank', 'noopener,noreferrer');
    showToast('Google sign-in opened. OAuth integration can be connected next.');
  }

  if (mode === 'login') {
    return (
      <main className="auth-shell login-shell">
        <section className="login-card">
          <div className="login-top-cta">
            <span>New here?</span>
            <button className="register-btn ghost" onClick={onSwitch} type="button">
              Create an account <span aria-hidden="true">&rarr;</span>
            </button>
          </div>

          <header className="login-header">
            <h1>Login</h1>
            <p>Sign in to your account to continue</p>
          </header>

          <div className="login-form">
            <label className="field block login-field">
              <span>Email *</span>
              <div className="input-shell">
                <span className="input-icon" aria-hidden="true">&#9993;</span>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
                />
              </div>
            </label>

            <label className="field block login-field">
              <span>Password *</span>
              <div className="input-shell">
                <span className="input-icon" aria-hidden="true">&#128274;</span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))}
                />
                <span className="input-icon right" aria-hidden="true">&#9675;</span>
              </div>
            </label>

            <div className="login-row">
              <label className="remember">
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
              <button className="text-link" type="button" onClick={handleForgotPassword}>Forgot password?</button>
            </div>
          </div>

          <button className="login-primary-btn" type="button" onClick={onSubmit} disabled={loading}>
            {loading ? 'Please wait...' : 'Log In  ->'}
          </button>

          <div className="login-divider"><span>or</span></div>

          <button className="google-btn" type="button" onClick={handleGoogleContinue}>
            <span className="google-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.56-5.17 3.56-8.67z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.01c-1.08.72-2.45 1.14-4.05 1.14-3.11 0-5.74-2.1-6.68-4.93H1.31v3.1A12 12 0 0 0 12 24z"/>
                <path fill="#FBBC05" d="M5.32 14.3A7.2 7.2 0 0 1 4.95 12c0-.8.14-1.57.37-2.3V6.6H1.31A12 12 0 0 0 0 12c0 1.93.46 3.75 1.31 5.4l4.01-3.1z"/>
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.76l3.43-3.43C17.94 1.16 15.24 0 12 0A12 12 0 0 0 1.31 6.6l4.01 3.1c.94-2.83 3.57-4.93 6.68-4.93z"/>
              </svg>
            </span>
            Continue with Google
          </button>

          <p className="login-privacy">We respect your privacy and keep your data safe.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell register-shell">
      <header className="register-topbar">
        <div className="register-brand">
          <div className="register-brand-icon">P</div>
          <div>
            <strong>PM Internship Scheme</strong>
            <small>Empowering Future Professionals</small>
          </div>
        </div>
        <nav className="register-nav">
          <span>Home</span><span>Internships</span><span>Roadmap</span><span>Profile</span><span>Settings</span>
        </nav>
        <button className="register-login-chip" onClick={onSwitch} type="button">Already have an account? Login</button>
      </header>

      <section className="register-layout single-card">
        <section className="register-form-card unified">
          <div className="register-hero-inline">
            <p className="eyebrow">Create your account</p>
            <h2>Start Your <span>Internship Journey</span></h2>
            <p>{subtitle}</p>
          </div>
          <div className="panel-heading">
            <h2>Personal Information</h2>
            <p>Tell us about yourself</p>
          </div>
          <div className="form-grid">
            <label className="field block">
              <span>Full name *</span>
              <input value={form.fullName} onChange={event => setForm(prev => ({ ...prev, fullName: event.target.value }))} />
            </label>
            <label className="field block">
              <span>Email *</span>
              <input type="email" value={form.email} onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))} />
            </label>
            <label className="field block">
              <span>Password *</span>
              <input type="password" value={form.password} onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))} />
            </label>
            <label className="field block">
              <span>Phone number *</span>
              <input value={form.phone} onChange={event => setForm(prev => ({ ...prev, phone: event.target.value }))} />
            </label>
            <label className="field block">
              <span>Aadhaar number *</span>
              <input
                inputMode="numeric"
                maxLength="12"
                value={form.aadhaarNumber || ''}
                onChange={event => setForm(prev => ({ ...prev, aadhaarNumber: event.target.value.replace(/\D/g, '').slice(0, 12) }))}
              />
            </label>
            <label className="field block full">
              <span>Address *</span>
              <textarea rows="3" value={form.address} onChange={event => setForm(prev => ({ ...prev, address: event.target.value }))} />
            </label>
            <label className="field block">
              <span>GitHub profile</span>
              <input
                placeholder="https://github.com/yourname"
                value={form.socialLinks?.github || ''}
                onChange={event => setForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), github: event.target.value } }))}
              />
            </label>
            <label className="field block">
              <span>LinkedIn profile</span>
              <input
                placeholder="https://linkedin.com/in/yourname"
                value={form.socialLinks?.linkedin || ''}
                onChange={event => setForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), linkedin: event.target.value } }))}
              />
            </label>
            <label className="field block">
              <span>Highest qualification *</span>
              <select value={form.highestQualification} onChange={event => setForm(prev => ({ ...prev, highestQualification: event.target.value }))}>
                {QUALIFICATIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="field block">
              <span>Profile photo</span>
              <input type="file" accept="image/*" onChange={handlePhoto} />
            </label>
            <div className="field block">
              <span>Location coordinates</span>
              <button className="action-btn secondary" type="button" onClick={() => onUseCurrentLocation?.('register')}>
                Use my current location
              </button>
              <p className="helper-copy">
                {form.coordinates?.lat && form.coordinates?.lng
                  ? `Captured: ${form.coordinates.lat}, ${form.coordinates.lng}`
                  : 'Location not captured yet.'}
              </p>
            </div>
            <div className="field full">
              <span className="section-title">Documents</span>
              <p className="helper-copy">Upload your resume and every marksheet visible for the selected highest qualification.</p>
              {renderDocumentPicker(form, 'resume', handleRegisterDocumentSelect)}
            </div>
            <div className="field full">
              <span className="section-title">Registration summary</span>
              <p className="helper-copy">The form changes as soon as you choose the highest qualification, and you can select only one preferred location.</p>
              <ProfileStrength form={form} />
            </div>
            <div className="field full">
              <span className="section-title">Academic details</span>
              <p className="helper-copy">We only ask for the academic sections needed for the selected education level.</p>
              <div className="academic-section-stack">
                {renderAcademicSections(form, bindNested, {
                  showDocuments: true,
                  onDocumentSelect: handleRegisterDocumentSelect,
                })}
              </div>
            </div>
            <div className="field full">
              <span className="section-title">Preferred location *</span>
              <p className="helper-copy">Choose one location only. This will influence the internships shown in the portal.</p>
              <div className="location-grid">
                {locationOptions.map(location => (
                  <button key={location} className={`location-card ${selectedLocation === location ? 'selected' : ''}`} type="button" onClick={() => selectLocation(location)}>
                    <strong>{location}</strong>
                    <span>{selectedLocation === location ? 'Selected' : 'Set as preferred location'}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field full">
              <span className="section-title">Skills *</span>
              <p className="helper-copy">Select the skills you already have. The portal will use these skills to rank five internships for you.</p>
              <div className="chip-row large">
                {skillOptions.map(skill => (
                  <button key={skill} className={`skill-chip ${form.skills.includes(skill) ? 'selected' : ''}`} type="button" onClick={() => toggleSkill(skill)}>
                    {skillName(skill)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="action-btn primary wide register-submit" type="button" onClick={onSubmit} disabled={loading}>
            {loading ? 'Please wait...' : 'Register & Enter Workspace'}
          </button>
        </section>
      </section>
    </main>
  );
}
export default function App() {
  const [route, setRoute] = useState(readRoute());
  const [authLoading, setAuthLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [internshipMetadata, setInternshipMetadata] = useState({ skills: [], locations: [], source: 'fallback', count: 0 });
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [profileDraft, setProfileDraft] = useState(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [roadmapData, setRoadmapData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [applyState, setApplyState] = useState({});
  const [applyModalInternship, setApplyModalInternship] = useState(null);
  const [readyMatchIds, setReadyMatchIds] = useState([]);
  const [growthPickIds, setGrowthPickIds] = useState([]);
  const [recommendationPreferences, setRecommendationPreferences] = useState(EMPTY_PREFERENCES);
  const [homeSearch, setHomeSearch] = useState('');
  const [homeFilters, setHomeFilters] = useState(EMPTY_HOME_FILTERS);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [homeSlide, setHomeSlide] = useState(0);
  const [activeRoadmapContext, setActiveRoadmapContext] = useState(getStoredRoadmapContext);
  const authMode = route === '/register' ? 'register' : 'login';
  const dynamicSkillLabels = {
    ...SKILL_LABELS,
    ...Object.fromEntries((internshipMetadata.skills || []).map(skill => [skill.value, skill.label])),
  };
  const skillOptions = internshipMetadata.skills?.length
    ? internshipMetadata.skills.map(skill => skill.value)
    : SKILL_OPTIONS;
  const locationOptions = internshipMetadata.locations?.length ? internshipMetadata.locations : LOCATIONS;
  const getSkillLabel = skill => dynamicSkillLabels[skill] || labelForSkill(skill);

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
    API.internshipMetadata()
      .then(data => setInternshipMetadata(data))
      .catch(() => setInternshipMetadata({ skills: [], locations: [], source: 'fallback', count: 0 }));
  }, []);

  useEffect(() => {
    API.me()
      .then(data => {
        const currentRoute = readRoute();
        if (data.authenticated) {
          setUser(data.user);
          setProfileDraft(data.user);
          if (currentRoute === '/login' || currentRoute === '/register') {
            goTo('/home');
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

  useEffect(() => {
    let cancelled = false;

    async function restoreRoadmapFromSession(context) {
      try {
        const data = await API.getRoadmap(context.internshipId, context.skill);
        if (cancelled) return;
        logGeminiRoadmapDebug(data, 'session restore');
        setRoadmapData(data);
        setChatMessages([
          {
            role: 'assistant',
            text: `I am your roadmap copilot for ${data.internship.title} at ${data.internship.org}. Ask what to learn first, ask for a weekly plan, or say "tick next mission" after you finish a level.`,
          },
        ]);
      } catch {
        if (cancelled) return;
        Storage.remove(ROADMAP_SESSION_KEY);
        showToast('Open a missing-skill internship first to enter the roadmap page.');
        goTo('/home');
      }
    }

    if (route === '/upskill' && !roadmapData) {
      const savedContext = getStoredRoadmapContext();
      if (!savedContext) {
        showToast('Open a missing-skill internship first to enter the roadmap page.');
        goTo('/growth-picks');
      } else {
        restoreRoadmapFromSession(savedContext);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [route, roadmapData]);

  function navigate(path) {
    if (path !== '/profile') {
      setProfileEditing(false);
    }
    if (path !== '/upskill') {
      setRoadmapData(null);
      setChatMessages([]);
      setChatInput('');
      setActiveRoadmapContext(null);
      Storage.remove(ROADMAP_SESSION_KEY);
    }
    goTo(path);
  }

  async function loadDashboard() {
    try {
      const data = await API.dashboard();
      const normalized = normalizeDashboard(data);
      setDashboard(normalized);
      setReadyMatchIds(prev => {
        if (prev.length) return prev;
        return (normalized.readyMatches || []).map(item => item.id).slice(0, 5);
      });
      setGrowthPickIds(prev => {
        if (prev.length) return prev;
        return (normalized.growthPicks || []).map(item => item.id).slice(0, 5);
      });
      setUser(prev => (prev ? { ...prev, ...data.profile } : data.profile));
      if (!profileEditing) {
        setProfileDraft(data.profile);
      }
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleRegister() {
    const missingItems = getRegistrationMissingItems(registerForm);
    if (missingItems.length) {
      showToast(formatMissingItems(missingItems));
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = buildRegistrationFormData(registerForm);
      const data = await API.register(payload);
      setUser(data.user);
      setProfileDraft(data.user);
      setRegisterForm(emptyRegisterForm());
      fireConfetti(32);
      showToast('Profile created');
      navigate('/home');
    } catch (error) {
      showToast(error.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleLogin() {
    if (!loginForm.email?.trim() || !loginForm.password?.trim()) {
      showToast('Please fill all mandatory (*) fields before login.');
      return;
    }
    setSubmitLoading(true);
    try {
      const data = await API.login(loginForm);
      setUser(data.user);
      setProfileDraft(data.user);
      showToast('Welcome back');
      navigate('/home');
    } catch (error) {
      showToast(error.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleLogout() {
    await API.logout().catch(() => null);
    setUser(null);
    setDashboard(EMPTY_DASHBOARD);
    setReadyMatchIds([]);
    setGrowthPickIds([]);
    navigate('/login');
  }

  async function handleRefresh() {
    try {
      const data = await API.refreshRecommendations(recommendationPreferences);
      const normalized = normalizeDashboard(data);
      setDashboard(normalized);
      setReadyMatchIds((normalized.readyMatches || []).map(item => item.id).slice(0, 5));
      setGrowthPickIds((normalized.growthPicks || []).map(item => item.id).slice(0, 5));
      setUser(prev => ({ ...prev, ...data.profile }));
      setProfileDraft(data.profile);
      showToast('Recommendation lists refreshed');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function handleLoadRoadmap(internshipId, skill, refresh = false) {
    const internship = findInternshipById(internshipId);
    const nextContext = { internshipId, skill };
    if (
      activeRoadmapContext
      && (activeRoadmapContext.internshipId !== internshipId || activeRoadmapContext.skill !== skill)
    ) {
      showToast('Complete your active roadmap first before opening another skill-gap internship.');
      return;
    }

    if (!skill) {
      showToast('Choose one missing skill to start a focused roadmap.');
      return;
    }
    if (internship && !internship.missingSkills?.includes(skill)) {
      showToast('That skill is already covered for this internship.');
      if (!internship.missingSkills?.length) {
        openApplyModal(internship);
      }
      return;
    }
    try {
      const data = await API.getRoadmap(internshipId, skill, refresh);
      logGeminiRoadmapDebug(data, refresh ? 'regenerate' : 'open');
      setRoadmapData(data);
      setActiveRoadmapContext(nextContext);
      Storage.set(ROADMAP_SESSION_KEY, nextContext);
      setChatMessages([
        {
          role: 'assistant',
          text: `I am your roadmap copilot for ${getSkillLabel(skill)} at ${data.internship.org}. Ask what to learn first, ask for a weekly plan, or say "tick next mission" after you finish a level.`,
        },
      ]);
      showToast(refresh ? `Roadmap regenerated via ${data.roadmap.source}` : 'Roadmap opened');
      goTo('/upskill');
    } catch (error) {
      showToast(error.message);
    }
  }

  async function completeLevel(levelId) {
    if (!roadmapData) return false;
    try {
      const activeSkill = roadmapData.skill || activeRoadmapContext?.skill;
      const data = await API.completeRoadmapLevel(roadmapData.internship.id, levelId, activeSkill);
      setRoadmapData(prev => ({ ...prev, roadmap: data.roadmap }));
      setUser(prev => ({ ...prev, skills: data.skills }));
      setProfileDraft(prev => ({ ...prev, skills: data.skills }));
      const latest = await API.refreshRecommendations(recommendationPreferences);
      setDashboard(normalizeDashboard(latest));
      if (data.skillCompleted) {
        fireConfetti(28);
        showToast(`${getSkillLabel(data.skill)} added to your profile`);
        setRoadmapData(null);
        setActiveRoadmapContext(null);
        Storage.remove(ROADMAP_SESSION_KEY);
        goTo('/growth-picks');
      } else {
        showToast('Topic cleared and progress updated');
      }
      return Boolean(data.skillCompleted);
    } catch (error) {
      showToast(error.message);
      return false;
    }
  }

  async function completeNextRoadmapLevel(fromChat = false) {
    const nextLevel = getNextUnlockedLevel(roadmapData?.roadmap);
    if (!nextLevel) {
      showToast('All roadmap missions are already completed for this internship.');
      return;
    }
    const skillCompleted = await completeLevel(nextLevel.id);
    if (fromChat && !skillCompleted) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Marked ${nextLevel.topic} under ${getSkillLabel(nextLevel.skill)} as completed. Your gamification bar has moved forward.`,
        },
      ]);
    }
  }

  async function saveProfile() {
    if (profileDraft?.aadhaarNumber && !isValidAadhaar(profileDraft.aadhaarNumber)) {
      showToast('Enter a valid 12-digit Aadhaar number.');
      return;
    }
    try {
      const data = await API.updateProfile(sanitizeProfilePayload(profileDraft));
      setUser(data.profile);
      setProfileDraft(data.profile);
      setProfileEditing(false);
      showToast('Profile updated');
    } catch (error) {
      showToast(error.message);
    }
  }

  function cancelProfileEdit() {
    setProfileDraft(user);
    setProfileEditing(false);
  }

  async function onProfileDocumentSelect(kind, file) {
    if (!file) return;
    try {
      const data = await API.uploadDocument(kind, file, true);
      setProfileDraft(prev => ({
        ...(prev || {}),
        documents: { ...(prev?.documents || {}), [kind]: data.document },
      }));
      setUser(prev => ({
        ...(prev || {}),
        documents: { ...(prev?.documents || {}), [kind]: data.document },
      }));
      showToast(`${DOCUMENT_LABELS[kind]} uploaded`);
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
    if (!payload.fullName || !payload.email || !payload.documents?.resume) {
      showToast('Please complete name, email, and resume before applying.');
      return;
    }
    try {
      await API.apply({
        internshipId: internship.id,
        fullName: payload.fullName || user.fullName,
        email: payload.email || user.email,
        aadhaarNumber: payload.aadhaarNumber || user.aadhaarNumber || '',
        address: payload.address || user.address || '',
        phone: payload.phone || user.phone,
        preferredLocations: payload.preferredLocations || user.preferredLocations || [],
        highestQualification: payload.highestQualification || user.highestQualification || '',
        secondary: payload.secondary || user.secondary || {},
        higherSecondary: payload.higherSecondary || user.higherSecondary || {},
        diploma: payload.diploma || user.diploma || {},
        graduation: payload.graduation || user.graduation || {},
        postGraduation: payload.postGraduation || user.postGraduation || {},
        skills: payload.skills || user.skills || [],
        socialLinks: payload.socialLinks || user.socialLinks || {},
        githubProfile: payload.socialLinks?.github || '',
        linkedinProfile: payload.socialLinks?.linkedin || '',
        documents: payload.documents || user.documents || {},
        resumeName: payload.documents?.resume?.originalName || '',
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
        aadhaarNumber: prev[internship.id]?.aadhaarNumber || user.aadhaarNumber || '',
        address: prev[internship.id]?.address || user.address || '',
        preferredLocations: prev[internship.id]?.preferredLocations || user.preferredLocations || [],
        highestQualification: prev[internship.id]?.highestQualification || user.highestQualification || '',
        secondary: prev[internship.id]?.secondary || user.secondary || {},
        higherSecondary: prev[internship.id]?.higherSecondary || user.higherSecondary || {},
        diploma: prev[internship.id]?.diploma || user.diploma || {},
        graduation: prev[internship.id]?.graduation || user.graduation || {},
        postGraduation: prev[internship.id]?.postGraduation || user.postGraduation || {},
        skills: prev[internship.id]?.skills || user.skills || [],
        socialLinks: prev[internship.id]?.socialLinks || user.socialLinks || { github: '', linkedin: '' },
        documents: prev[internship.id]?.documents || user.documents || {},
        resumeText: prev[internship.id]?.resumeText || '',
        coverNote: prev[internship.id]?.coverNote || '',
      },
    }));
    setApplyModalInternship(internship);
  }

  async function onApplicationDocumentSelect(internshipId, kind, file) {
    if (!file) return;
    try {
      const data = await API.uploadDocument(kind, file, false);
      setApplyState(prev => ({
        ...prev,
        [internshipId]: {
          ...(prev[internshipId] || {}),
          documents: {
            ...(prev[internshipId]?.documents || {}),
            [kind]: data.document,
          },
        },
      }));
      showToast(`${DOCUMENT_LABELS[kind]} attached to this application`);
    } catch (error) {
      showToast(error.message);
    }
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
      const data = await API.chatRoadmap(roadmapData.internship.id, message, roadmapData.skill || activeRoadmapContext?.skill);
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

  function fetchBrowserLocation(target = 'register') {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported on this browser.');
      return;
    }
    if (!window.isSecureContext) {
      showToast('Location access needs HTTPS (or localhost). Open this site in a secure context.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const coordinates = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        };
        if (target === 'register') {
          setRegisterForm(prev => ({ ...prev, coordinates }));
        } else {
          setProfileDraft(prev => ({ ...(prev || {}), coordinates }));
        }
        showToast('Current location captured.');
      },
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          showToast('Location permission denied. Allow location access in your browser settings.');
          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          showToast('Location is unavailable right now. Check GPS/network and try again.');
          return;
        }
        if (error.code === error.TIMEOUT) {
          showToast('Location request timed out. Try again in a few seconds.');
          return;
        }
        showToast('Unable to fetch location. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 }
    );
  }

  function findInternshipById(internshipId) {
    return [
      ...(dashboard.catalog || []),
      ...(dashboard.recommended || []),
      ...(dashboard.qualified || []),
      ...(dashboard.stretch || []),
      ...(dashboard.readyMatches || []),
      ...(dashboard.growthPicks || []),
    ].find(item => item.id === internshipId);
  }

  function renderInternshipCard(internship, mode = 'catalog') {
    const hasGap = internship.missingSkills?.length > 0;
    const isApplied = Boolean(applicationsById[internship.id]);
    const isReadyMode = mode === 'ready';
    const isGrowthMode = mode === 'growth';
    const canApply = !hasGap && (isReadyMode || isGrowthMode);
    return (
      <DashboardCard
        key={internship.id}
        internship={internship}
        skillLabels={dynamicSkillLabels}
        actionLabel={canApply ? (isApplied ? 'Applied' : 'Apply now') : null}
        onAction={() => {
          if (isApplied || !canApply) return;
          openApplyModal(internship);
        }}
        actionClass={isApplied ? 'disabled' : 'primary'}
      >
        {isApplied && (
          <p className="success-copy">Submitted on {new Date(applicationsById[internship.id].applied_at).toLocaleDateString('en-IN')}</p>
        )}
        {mode === 'catalog' && (
          <p className="catalog-fit-copy">{getFitLabel(internship)} for your current profile.</p>
        )}
        {isGrowthMode && !hasGap && (
          <p className="success-copy">Qualified now. You can apply without refreshing this fixed list.</p>
        )}
        {isGrowthMode && hasGap && (
          <div className="learn-button-row">
            {internship.missingSkills.slice(0, 2).map(skill => (
              <button
                key={`${internship.id}-${skill}`}
                className="action-btn secondary"
                type="button"
                onClick={() => handleLoadRoadmap(internship.id, skill)}
              >
                Learn {getSkillLabel(skill)}
              </button>
            ))}
          </div>
        )}
      </DashboardCard>
    );
  }

  const homeSlides = [
    {
      eyebrow: 'Live opportunity atlas',
      title: 'Every internship, ranked around your profile.',
      copy: 'Browse the full Excel-backed catalog with fit labels, location signals, stipend context, and ML scoring on every card.',
    },
    {
      eyebrow: 'Ready Matches',
      title: 'Five roles you can apply to right now.',
      copy: 'Set your domain, location, stipend, and experience preferences, then refresh a fixed list of fully qualified internships.',
    },
    {
      eyebrow: 'Growth Picks',
      title: 'Higher-upside roles unlocked by one or two skills.',
      copy: 'Open a single-skill roadmap, complete the animated levels, and the skill is added back to your profile instantly.',
    },
  ];

  useEffect(() => {
    if (route !== '/home') return undefined;
    const id = setInterval(() => setHomeSlide(prev => (prev + 1) % 3), 4300);
    return () => clearInterval(id);
  }, [route]);

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
        onUseCurrentLocation={fetchBrowserLocation}
        skillOptions={skillOptions}
        skillLabels={dynamicSkillLabels}
        locationOptions={locationOptions}
      />
    );
  }

  const applicationsById = Object.fromEntries(dashboard.applications.map(item => [item.internship_id, item]));
  const roadmapProgress = getRoadmapProgress(roadmapData?.roadmap);
  const roadmapBadge = getXpBadge(roadmapProgress);
  const roadmapCompleted = Boolean(
    roadmapData?.internship && (roadmapProgress.total === 0 || roadmapProgress.completed === roadmapProgress.total)
  );
  const roadmapProgressPercent = roadmapCompleted ? 100 : roadmapProgress.percent;
  const activeSlide = homeSlides[homeSlide % homeSlides.length];
  const catalogItems = dashboard.catalog || [];
  const readyItems = readyMatchIds.map(findInternshipById).filter(Boolean);
  const growthItems = growthPickIds.map(findInternshipById).filter(Boolean);
  const domainOptions = Array.from(new Set(catalogItems.map(item => item.sector).filter(Boolean))).sort();
  const catalogLocations = Array.from(new Set(catalogItems.map(item => item.location).filter(Boolean))).sort();
  const jobTypeOptions = Array.from(new Set(catalogItems.map(item => item.jobType).filter(Boolean))).sort();
  const experienceOptions = Array.from(new Set(catalogItems.map(item => item.experience).filter(Boolean))).sort();
  const searchText = homeSearch.trim().toLowerCase();
  const filteredCatalog = catalogItems.filter(item => {
    const haystack = [
      item.title,
      item.org,
      item.location,
      item.jobType,
      item.sector,
      item.experience,
      ...(item.skills || []),
    ].join(' ').toLowerCase();
    const matchesSearch = !searchText || haystack.includes(searchText);
    const matchesDomain = homeFilters.domain === 'all' || item.sector === homeFilters.domain;
    const matchesLocation = homeFilters.location === 'all' || item.location === homeFilters.location;
    const matchesJobType = homeFilters.jobType === 'all' || item.jobType === homeFilters.jobType;
    const matchesExperience = homeFilters.experience === 'all' || item.experience === homeFilters.experience;
    const matchesStipend = homeFilters.stipendType === 'all' || getStipendType(item) === homeFilters.stipendType;
    const label = getFitLabel(item);
    const matchesFit =
      homeFilters.fit === 'all'
      || (homeFilters.fit === 'qualified' && !item.missingSkills?.length)
      || (homeFilters.fit === 'stretch' && item.missingSkills?.length >= 1 && item.missingSkills?.length <= 2)
      || (homeFilters.fit === 'not-ideal' && label === 'Not ideal')
      || (homeFilters.fit === 'highly-aligned' && label === 'Highly aligned');
    return matchesSearch && matchesDomain && matchesLocation && matchesJobType && matchesExperience && matchesStipend && matchesFit;
  });

  function updatePreference(key, value) {
    setRecommendationPreferences(prev => ({ ...prev, [key]: value }));
  }

  function updateHomeFilter(key, value) {
    setHomeFilters(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="app-shell">
      <header className="topbar glass-card">
        <button className="brand-lockup" onClick={() => navigate('/home')} type="button">
          <span className="brand-mark">PM</span>
          <span>
            <strong>PM Internship Engine</strong>
            <small>ML ranked opportunities and focused growth roadmaps</small>
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
        {route === '/home' && (
          <>
            <section className="home-hero premium-hero">
              <div className="premium-hero-copy">
                <p className="eyebrow">{activeSlide.eyebrow}</p>
                <h1>{activeSlide.title}</h1>
                <p>{activeSlide.copy}</p>
                <div className="hero-actions">
                  <button className="action-btn primary" type="button" onClick={() => navigate('/ready-matches')}>Generate ready matches</button>
                  <button className="action-btn secondary" type="button" onClick={() => navigate('/growth-picks')}>View growth picks</button>
                </div>
              </div>
              <div className="hero-showcase">
                <div className="hero-showcase-card">
                  <span>Catalog</span>
                  <strong>{catalogItems.length}</strong>
                  <small>Excel-backed internships</small>
                </div>
                <div className="hero-showcase-card">
                  <span>Ready</span>
                  <strong>{dashboard.readyMatches.length}</strong>
                  <small>Qualified choices</small>
                </div>
                <div className="hero-showcase-card">
                  <span>Growth</span>
                  <strong>{dashboard.growthPicks.length}</strong>
                  <small>1-2 skill gaps</small>
                </div>
              </div>
              <div className="hero-slide-dots" aria-label="Hero slideshow">
                {homeSlides.map((slide, index) => (
                  <button
                    key={slide.eyebrow}
                    className={index === homeSlide ? 'active' : ''}
                    type="button"
                    aria-label={`Show slide ${index + 1}`}
                    onClick={() => setHomeSlide(index)}
                  />
                ))}
              </div>
            </section>

            <section className="catalog-section">
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">Internship catalog</p>
                  <h2>Browse all live internships</h2>
                </div>
                <span className="catalog-count">{filteredCatalog.length} shown</span>
              </div>

              <div className="catalog-controls">
                <label className="field block catalog-search">
                  <span>Search</span>
                  <input
                    value={homeSearch}
                    onChange={event => setHomeSearch(event.target.value)}
                    placeholder="Search by role, company, skill, location, or domain"
                  />
                </label>
                <label className="field block">
                  <span>Domain</span>
                  <select value={homeFilters.domain} onChange={event => updateHomeFilter('domain', event.target.value)}>
                    <option value="all">All domains</option>
                    {domainOptions.map(domain => <option key={domain} value={domain}>{domain}</option>)}
                  </select>
                </label>
                <label className="field block">
                  <span>Location</span>
                  <select value={homeFilters.location} onChange={event => updateHomeFilter('location', event.target.value)}>
                    <option value="all">All locations</option>
                    {catalogLocations.map(location => <option key={location} value={location}>{location}</option>)}
                  </select>
                </label>
                <label className="field block">
                  <span>Job type</span>
                  <select value={homeFilters.jobType} onChange={event => updateHomeFilter('jobType', event.target.value)}>
                    <option value="all">All types</option>
                    {jobTypeOptions.map(jobType => <option key={jobType} value={jobType}>{jobType}</option>)}
                  </select>
                </label>
                <label className="field block">
                  <span>Experience</span>
                  <select value={homeFilters.experience} onChange={event => updateHomeFilter('experience', event.target.value)}>
                    <option value="all">Any experience</option>
                    {experienceOptions.map(experience => <option key={experience} value={experience}>{experience}</option>)}
                  </select>
                </label>
                <label className="field block">
                  <span>Stipend</span>
                  <select value={homeFilters.stipendType} onChange={event => updateHomeFilter('stipendType', event.target.value)}>
                    <option value="all">Any stipend</option>
                    <option value="paid">Paid stipend</option>
                    <option value="free">Free/performance-based</option>
                  </select>
                </label>
                <label className="field block">
                  <span>Fit</span>
                  <select value={homeFilters.fit} onChange={event => updateHomeFilter('fit', event.target.value)}>
                    <option value="all">All fit levels</option>
                    <option value="highly-aligned">Highly aligned</option>
                    <option value="qualified">Qualified now</option>
                    <option value="stretch">Stretch</option>
                    <option value="not-ideal">Not ideal</option>
                  </select>
                </label>
              </div>

              <div className="card-grid catalog-grid">
                {filteredCatalog.map(item => renderInternshipCard(item, 'catalog'))}
              </div>
            </section>
          </>
        )}

        {route === '/ready-matches' && (
          <section className="page-grid">
            <div className="panel-stack">
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">Ready Matches</p>
                  <h2>Five internships you qualify for now</h2>
                </div>
                <button className="action-btn secondary" type="button" onClick={handleRefresh}>Refresh Lists</button>
              </div>

              <div className="preference-panel">
                <label className="field block">
                  <span>Domain</span>
                  <select value={recommendationPreferences.domain} onChange={event => updatePreference('domain', event.target.value)}>
                    <option value="any">Any domain</option>
                    {domainOptions.map(domain => <option key={domain} value={domain}>{domain}</option>)}
                  </select>
                </label>
                <label className="field block">
                  <span>Desired location</span>
                  <select value={recommendationPreferences.desiredLocation} onChange={event => updatePreference('desiredLocation', event.target.value)}>
                    <option value="">Use profile location</option>
                    {Array.from(new Set([...locationOptions, ...catalogLocations])).map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </label>
                <label className="field block">
                  <span>Job type</span>
                  <select value={recommendationPreferences.jobType} onChange={event => updatePreference('jobType', event.target.value)}>
                    <option value="any">Any type</option>
                    {jobTypeOptions.map(jobType => <option key={jobType} value={jobType}>{jobType}</option>)}
                  </select>
                </label>
                <label className="field block">
                  <span>Stipend preference</span>
                  <select value={recommendationPreferences.stipendPreference} onChange={event => updatePreference('stipendPreference', event.target.value)}>
                    <option>Any</option>
                    <option>Paid stipend</option>
                    <option>Free/performance-based</option>
                  </select>
                </label>
                <label className="field block">
                  <span>Experience fit</span>
                  <select value={recommendationPreferences.experiencePreference} onChange={event => updatePreference('experiencePreference', event.target.value)}>
                    <option>Any</option>
                    <option>Fresher</option>
                    <option>Experienced</option>
                  </select>
                </label>
                <label className="field block">
                  <span>Experience amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={recommendationPreferences.experienceAmount}
                    onChange={event => updatePreference('experienceAmount', event.target.value)}
                    placeholder="Years"
                  />
                </label>
              </div>

              <div className="summary-strip">
                <div className="summary-pill"><strong>{readyItems.length}</strong><span>fixed ready matches</span></div>
                <div className="summary-pill"><strong>{growthItems.length}</strong><span>growth picks waiting</span></div>
              </div>

              {readyItems.length > 0 ? (
                <div className="card-grid">
                  {readyItems.map(item => renderInternshipCard(item, 'ready'))}
                </div>
              ) : (
                <div className="empty-state glass-card">
                  <h3>No ready matches yet</h3>
                  <p>Refresh the lists after choosing preferences.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {route === '/growth-picks' && (
          <section className="page-grid">
            <div className="panel-stack">
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">Growth Picks</p>
                  <h2>Better internships within one or two skills</h2>
                </div>
                <button className="action-btn secondary" type="button" onClick={handleRefresh}>Refresh Lists</button>
              </div>

              <div className="summary-strip">
                <div className="summary-pill"><strong>{growthItems.length}</strong><span>fixed growth picks</span></div>
                <div className="summary-pill"><strong>{user.skills?.length || 0}</strong><span>skills on profile</span></div>
              </div>

              {growthItems.length > 0 ? (
                <div className="card-grid">
                  {growthItems.map(item => renderInternshipCard(item, 'growth'))}
                </div>
              ) : (
                <div className="empty-state glass-card">
                  <h3>No growth picks yet</h3>
                  <p>Refresh the lists to find high-upside roles with a small skill gap.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {route === '/upskill' && roadmapData && (
          <section className="dual-layout roadmap-page">
            <div className="stretch-list glass-card">
              <div className="panel-heading">
                <h2>{getSkillLabel(roadmapData?.skill || activeRoadmapContext?.skill || '')} roadmap</h2>
                <p>One focused skill path for the selected growth pick.</p>
              </div>
              {!roadmapData?.internship ? (
                <div className="empty-state">
                  <h3>No active roadmap selected</h3>
                  <p>Open one growth pick to start learning.</p>
                </div>
              ) : (
                <div className="stack-list">
                  <button
                    key={roadmapData.internship.id}
                    className="stretch-item active"
                    type="button"
                    onClick={() => null}
                  >
                    <span>
                      <strong>{roadmapData.internship.title}</strong>
                      <small>{roadmapData.internship.org}</small>
                    </span>
                    <em>{getSkillLabel(roadmapData.skill)}</em>
                  </button>
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
                      <p className="eyebrow">Focused roadmap</p>
                      <h2>{roadmapData.internship.title}</h2>
                      <p>{roadmapData.internship.org} - {roadmapData.internship.location}</p>
                    </div>
                    <div className="hero-actions">
                      <button
                        className={`action-btn ${roadmapCompleted ? 'primary' : 'disabled'}`}
                        type="button"
                        onClick={() => roadmapCompleted && openApplyModal(roadmapData.internship)}
                        disabled={!roadmapCompleted}
                      >
                        Apply now
                      </button>
                      <button className="action-btn secondary" type="button" onClick={() => navigate('/growth-picks')}>Back to Growth Picks</button>
                    </div>
                  </div>

                  <div className="gamification-panel">
                    <div>
                      <p className="eyebrow">Animated progress</p>
                      <h3>{roadmapProgress.completed} of {roadmapProgress.total} topics completed</h3>
                      <p className="muted-copy">XP: {roadmapBadge.xp} - Badge: {roadmapBadge.badge}</p>
                    </div>
                    <div className="progress-meter">
                      <div className={`progress-meter-bar ${roadmapCompleted ? 'complete' : ''}`} style={{ width: `${roadmapProgressPercent}%` }} />
                    </div>
                    <p className="muted-copy">Complete the final topic to add this skill to your profile.</p>
                  </div>

                  <div className="chatbot-panel chatbot-panel-top">
                    <div className="chatbot-panel-head">
                      <div className="panel-heading compact">
                        <h2>AI Roadmap Copilot</h2>
                        <p>Ask about the active topic order or mark the next topic complete.</p>
                      </div>
                      <div className={`chatbot-badge ${roadmapData.roadmap.source === 'gemini' ? 'gemini' : 'fallback'}`}>
                        {roadmapData.roadmap.source === 'gemini' ? 'Gemini generated' : 'Fallback syllabus'}
                      </div>
                    </div>
                    {roadmapData.roadmap.source !== 'gemini' && (
                      <div className="roadmap-source-alert">
                        <div>
                          <span>Gemini unavailable: {roadmapData.roadmap.sourceDetail || 'unknown reason'}</span>
                          {roadmapData.roadmap.rawPreview && (
                            <details className="raw-preview">
                              <summary>Raw Gemini response</summary>
                              <pre>{roadmapData.roadmap.rawPreview}</pre>
                            </details>
                          )}
                        </div>
                        <button
                          className="action-btn secondary"
                          type="button"
                          onClick={() => handleLoadRoadmap(roadmapData.internship.id, roadmapData.skill, true)}
                        >
                          Regenerate with Gemini
                        </button>
                      </div>
                    )}
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
                          placeholder='Ask what to learn first, or type "tick next mission"'
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
                              <h3>{getSkillLabel(track.skill)}</h3>
                              <p>{progress}% complete</p>
                            </div>
                            <div className="xp-ring">{progress}%</div>
                          </div>
                          <div className="level-stack">
                            {track.levels.map((level, index) => (
                              <div
                                key={level.id}
                                className={`level-row waterfall-level ${level.completed ? 'done' : level.unlocked ? 'open' : 'locked'}`}
                                style={{ marginLeft: `${index % 2 === 0 ? 0 : 34}px` }}
                              >
                                <div className="level-row-body">
                                  <span>{level.label}</span>
                                  <strong>{level.topic}</strong>
                                  {!level.completed && !level.unlocked && (
                                    <small>Locked until the previous topic is completed.</small>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className={`mission-check ${level.completed ? 'checked' : ''}`}
                                  disabled={!level.unlocked || level.completed}
                                  onClick={() => completeLevel(level.id)}
                                  aria-label={level.completed ? `${level.topic} completed` : level.unlocked ? `Mark ${level.topic} as complete` : `${level.topic} is locked`}
                                >
                                  {level.completed ? 'Completed' : level.unlocked ? 'Mark as complete' : 'Locked'}
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
          <section className={`profile-layout professional-profile ${profileEditing ? 'editing' : ''}`}>
            <div className="glass-card profile-pro-hero">
              <div className="profile-cover-strip" />
              <div className="profile-pro-main">
                <div className="profile-avatar large">
                  {profileDraft.photo ? <img src={profileDraft.photo} alt={profileDraft.fullName} /> : <span>{(profileDraft.fullName || 'P').slice(0, 1).toUpperCase()}</span>}
                </div>
                <div className="profile-title-block">
                  <p className="eyebrow">Candidate profile</p>
                  <h2>{profileDraft.fullName || 'Unnamed candidate'}</h2>
                  <p>{profileDraft.email} - {profileDraft.preferredLocations?.[0] || 'No preferred location'}</p>
                  <div className="profile-link-row">
                    {profileDraft.socialLinks?.github ? <a href={profileDraft.socialLinks.github} target="_blank" rel="noreferrer">GitHub</a> : <span>GitHub not connected</span>}
                    {profileDraft.socialLinks?.linkedin ? <a href={profileDraft.socialLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> : <span>LinkedIn not connected</span>}
                  </div>
                </div>
                <div className="profile-actions">
                  {!profileEditing ? (
                    <button className="action-btn primary" type="button" onClick={() => setProfileEditing(true)}>Edit profile</button>
                  ) : (
                    <>
                      <button className="action-btn secondary" type="button" onClick={cancelProfileEdit}>Cancel</button>
                      <button className="action-btn primary" type="button" onClick={saveProfile}>Save changes</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!profileEditing ? (
              <>
                <ProfileStrength form={profileDraft} />
                <div className="profile-pro-grid">
                  <article className="glass-card profile-panel">
                    <h3>About</h3>
                    <div className="profile-fact-list">
                      <span><strong>Phone</strong>{profileDraft.phone || 'Not added'}</span>
                      <span><strong>Aadhaar</strong>{profileDraft.aadhaarMasked || maskAadhaar(profileDraft.aadhaarNumber)}</span>
                      <span><strong>Address</strong>{profileDraft.address || 'Not added'}</span>
                      <span><strong>Qualification</strong>{QUALIFICATIONS.find(item => item.value === profileDraft.highestQualification)?.label || 'Not added'}</span>
                    </div>
                  </article>

                  <article className="glass-card profile-panel">
                    <h3>Skills</h3>
                    <div className="chip-row large">
                      {(profileDraft.skills || []).length ? profileDraft.skills.map(skill => (
                        <span key={skill} className="skill-chip selected">{getSkillLabel(skill)}</span>
                      )) : <p className="muted-copy">No skills added yet.</p>}
                    </div>
                  </article>

                  <article className="glass-card profile-panel wide">
                    <h3>Education timeline</h3>
                    <div className="education-timeline">
                      {getVisibleAcademicSections(profileDraft.highestQualification).map(section => (
                        <div className="timeline-item" key={section.key}>
                          <span className="timeline-dot" />
                          <div>
                            <strong>{section.title}</strong>
                            <p>{section.fields.map(field => profileDraft[section.key]?.[field.key]).filter(Boolean).join(' - ') || 'Details not added'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="glass-card profile-panel">
                    <h3>Documents</h3>
                    <div className="document-list">
                      {getRequiredDocumentKinds(profileDraft.highestQualification).map(kind => (
                        <span key={kind} className={profileDraft.documents?.[kind] ? 'ready' : 'missing'}>
                          <strong>{DOCUMENT_LABELS[kind]}</strong>
                          {profileDraft.documents?.[kind]?.originalName || 'Missing'}
                        </span>
                      ))}
                    </div>
                  </article>

                  <article className="glass-card profile-panel">
                    <h3>Applications</h3>
                    <div className="profile-stat-stack">
                      <strong>{dashboard.applications?.length || 0}</strong>
                      <span>submitted internships</span>
                    </div>
                  </article>

                  <article className="glass-card profile-panel wide github-panel">
                    <div className="section-heading-row compact-row">
                      <div>
                        <h3>GitHub contribution timeline</h3>
                        <p className="muted-copy">{getGithubUsername(profileDraft.socialLinks?.github) ? `@${getGithubUsername(profileDraft.socialLinks?.github)}` : 'Connect a GitHub profile to show public contributions.'}</p>
                      </div>
                      {profileDraft.socialLinks?.github && <a className="action-btn secondary" href={profileDraft.socialLinks.github} target="_blank" rel="noreferrer">Open GitHub</a>}
                    </div>
                    {getGithubUsername(profileDraft.socialLinks?.github) ? (
                      <img
                        className="github-contrib-chart"
                        alt="GitHub contribution timeline"
                        src={`https://ghchart.rshah.org/${encodeURIComponent(getGithubUsername(profileDraft.socialLinks.github))}`}
                      />
                    ) : (
                      <div className="placeholder-copy">No GitHub profile connected.</div>
                    )}
                  </article>
                </div>
              </>
            ) : (
              <section className="glass-card profile-edit-card">
                <div className="panel-heading">
                  <h2>Edit profile</h2>
                  <p>Update your public profile, academic records, documents, and matching signals.</p>
                </div>
                <div className="form-grid">
                  <label className="field block">
                    <span>Full name *</span>
                    <input value={profileDraft.fullName || ''} onChange={event => updateProfileField('fullName', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>Phone</span>
                    <input value={profileDraft.phone || ''} onChange={event => updateProfileField('phone', event.target.value)} />
                  </label>
                  <label className="field block">
                    <span>Aadhaar number</span>
                    <input
                      inputMode="numeric"
                      maxLength="12"
                      value={profileDraft.aadhaarNumber || ''}
                      onChange={event => updateProfileField('aadhaarNumber', event.target.value.replace(/\D/g, '').slice(0, 12))}
                    />
                  </label>
                  <label className="field block">
                    <span>Highest qualification</span>
                    <select value={profileDraft.highestQualification || 'graduation'} onChange={event => updateProfileField('highestQualification', event.target.value)}>
                      {QUALIFICATIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="field block">
                    <span>GitHub profile</span>
                    <input
                      value={profileDraft.socialLinks?.github || ''}
                      onChange={event => updateProfileField('socialLinks', { ...(profileDraft.socialLinks || {}), github: event.target.value })}
                    />
                  </label>
                  <label className="field block">
                    <span>LinkedIn profile</span>
                    <input
                      value={profileDraft.socialLinks?.linkedin || ''}
                      onChange={event => updateProfileField('socialLinks', { ...(profileDraft.socialLinks || {}), linkedin: event.target.value })}
                    />
                  </label>
                  <label className="field block full">
                    <span>Address</span>
                    <textarea rows="3" value={profileDraft.address || ''} onChange={event => updateProfileField('address', event.target.value)} />
                  </label>
                  <div className="field block full">
                    <span>Preferred location</span>
                    <button className="action-btn secondary" type="button" onClick={() => fetchBrowserLocation('profile')}>
                      Refresh current location for distance ranking
                    </button>
                    <div className="location-grid profile-location-grid">
                      {locationOptions.map(location => (
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
                    <span>Documents</span>
                    <div className="profile-document-grid">
                      {renderDocumentPicker(profileDraft, 'resume', onProfileDocumentSelect)}
                    </div>
                  </div>
                  <div className="field block full">
                    <span>Academic details</span>
                    <div className="academic-section-stack">
                      {renderAcademicSections(profileDraft, updateProfileNestedField, {
                        showDocuments: true,
                        onDocumentSelect: onProfileDocumentSelect,
                      })}
                    </div>
                  </div>
                  <div className="field block full">
                    <span>Skills</span>
                    <div className="chip-row large">
                      {skillOptions.map(skill => (
                        <button
                          key={skill}
                          className={`skill-chip ${profileDraft.skills?.includes(skill) ? 'selected' : ''}`}
                          type="button"
                          onClick={() => toggleDraftSkill(skill)}
                        >
                          {getSkillLabel(skill)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
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
              <p>{applyModalInternship.org} - Fill in the required details before submission.</p>
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
                <span>Email ID *</span>
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
                <span>Aadhaar number</span>
                <input
                  inputMode="numeric"
                  maxLength="12"
                  value={applyState[applyModalInternship.id]?.aadhaarNumber || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), aadhaarNumber: event.target.value.replace(/\D/g, '').slice(0, 12) },
                  }))}
                />
              </label>
              <label className="field block">
                <span>Preferred location</span>
                <select
                  value={applyState[applyModalInternship.id]?.preferredLocations?.[0] || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), preferredLocations: [event.target.value] },
                  }))}
                >
                  <option value="">Select location</option>
                  {locationOptions.map(location => <option key={location} value={location}>{location}</option>)}
                </select>
              </label>
              <label className="field block full">
                <span>Address</span>
                <textarea
                  rows="3"
                  value={applyState[applyModalInternship.id]?.address || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), address: event.target.value },
                  }))}
                />
              </label>
              <label className="field block">
                <span>GitHub profile</span>
                <input
                  placeholder="https://github.com/yourname"
                  value={applyState[applyModalInternship.id]?.socialLinks?.github || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: {
                      ...(prev[applyModalInternship.id] || {}),
                      socialLinks: { ...(prev[applyModalInternship.id]?.socialLinks || {}), github: event.target.value },
                    },
                  }))}
                />
              </label>
              <label className="field block">
                <span>LinkedIn profile</span>
                <input
                  placeholder="https://linkedin.com/in/yourname"
                  value={applyState[applyModalInternship.id]?.socialLinks?.linkedin || ''}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: {
                      ...(prev[applyModalInternship.id] || {}),
                      socialLinks: { ...(prev[applyModalInternship.id]?.socialLinks || {}), linkedin: event.target.value },
                    },
                  }))}
                />
              </label>
              <label className="field block">
                <span>Highest qualification</span>
                <select
                  value={applyState[applyModalInternship.id]?.highestQualification || 'graduation'}
                  onChange={event => setApplyState(prev => ({
                    ...prev,
                    [applyModalInternship.id]: { ...(prev[applyModalInternship.id] || {}), highestQualification: event.target.value },
                  }))}
                >
                  {QUALIFICATIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="field block full">
                <span>Documents</span>
                <div className="profile-document-grid">
                  {renderDocumentPicker(
                    applyState[applyModalInternship.id] || {},
                    'resume',
                    (kind, file) => onApplicationDocumentSelect(applyModalInternship.id, kind, file),
                  )}
                </div>
              </label>
              <div className="field block full">
                <span>Academic details and marksheets</span>
                <div className="academic-section-stack">
                  {renderAcademicSections(
                    applyState[applyModalInternship.id] || {},
                    (group, key, value) => setApplyState(prev => ({
                      ...prev,
                      [applyModalInternship.id]: {
                        ...(prev[applyModalInternship.id] || {}),
                        [group]: { ...(prev[applyModalInternship.id]?.[group] || {}), [key]: value },
                      },
                    })),
                    {
                      showDocuments: true,
                      onDocumentSelect: (kind, file) => onApplicationDocumentSelect(applyModalInternship.id, kind, file),
                    },
                  )}
                </div>
              </div>
              <div className="field block full">
                <span>Skills</span>
                <div className="chip-row large">
                  {skillOptions.map(skill => {
                    const selected = applyState[applyModalInternship.id]?.skills?.includes(skill);
                    return (
                      <button
                        key={skill}
                        className={`skill-chip ${selected ? 'selected' : ''}`}
                        type="button"
                        onClick={() => setApplyState(prev => {
                          const current = prev[applyModalInternship.id]?.skills || [];
                          return {
                            ...prev,
                            [applyModalInternship.id]: {
                              ...(prev[applyModalInternship.id] || {}),
                              skills: selected ? current.filter(item => item !== skill) : [...current, skill],
                            },
                          };
                        })}
                      >
                        {getSkillLabel(skill)}
                      </button>
                    );
                  })}
                </div>
              </div>
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




