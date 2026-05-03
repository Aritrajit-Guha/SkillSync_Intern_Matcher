import SkillChip from '../components/SkillChip.jsx';
import { EDUCATION, STATES, STREAMS } from '../data/catalog.js';

export default function ProfilePage({
  state,
  translations,
  skillLabels,
  trackLabels,
  onProfileChange,
  onToggleSkill,
  onToggleSector,
  onRunMatching,
}) {
  const profile = state.profile;

  return (
    <>
      <div className="section-head">
        <h2>{translations.profileHead}</h2>
        <p>{translations.profileSub}</p>
      </div>

      <div className="card profile-form-card">
        <div className="card-title">Candidate Snapshot</div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="inp-state">{translations.stateLabel}</label>
            <select id="inp-state" value={profile.state} onChange={event => onProfileChange('state', event.target.value)} aria-label={translations.stateLabel}>
              <option value="">{translations.statePlaceholder}</option>
              {STATES.map(item => <option value={item} key={item}>{item}</option>)}
            </select>
          </div>

          <div className="field">
            <label htmlFor="inp-edu">{translations.eduLabel}</label>
            <select id="inp-edu" value={profile.education} onChange={event => onProfileChange('education', event.target.value)} aria-label={translations.eduLabel}>
              <option value="">{translations.eduPlaceholder}</option>
              {EDUCATION.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="inp-stream">{translations.streamLabel}</label>
          <select id="inp-stream" value={profile.stream} onChange={event => onProfileChange('stream', event.target.value)} aria-label={translations.streamLabel}>
            <option value="">{translations.streamPlaceholder}</option>
            {STREAMS.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label>{translations.skillsLabel} <span className="field-hint">{translations.skillsHint}</span></label>
          <div className="chip-grid">
            {Object.entries(skillLabels).map(([value, label]) => (
              <SkillChip
                key={value}
                value={value}
                label={label}
                selected={profile.skills.includes(value)}
                type="skill"
                onToggle={onToggleSkill}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>{translations.sectorLabel} <span className="field-hint">{translations.sectorHint}</span></label>
          <div className="chip-grid">
            {Object.entries(trackLabels).map(([value, label]) => (
              <SkillChip
                key={value}
                value={value}
                label={label}
                selected={profile.sectors.includes(value)}
                type="sector"
                onToggle={onToggleSector}
              />
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-primary" onClick={onRunMatching} aria-label={translations.findBtn} type="button" disabled={state.isMatching}>
            <span>{state.isMatching ? 'Searching...' : translations.findBtn}</span>
          </button>
        </div>
      </div>
    </>
  );
}
