import { clamp, formatNumber } from '../utils/helpers.js';

const LEVELS = [
  { name: 'Starter', icon: 'L1', xpNeeded: 0 },
  { name: 'Explorer', icon: 'L2', xpNeeded: 60 },
  { name: 'Builder', icon: 'L3', xpNeeded: 180 },
  { name: 'Achiever', icon: 'L4', xpNeeded: 360 },
  { name: 'Candidate Pro', icon: 'L5', xpNeeded: 600 },
];

function getCurrentLevel(xp) {
  let level = 0;
  for (let i = LEVELS.length - 1; i >= 0; i -= 1) {
    if (xp >= LEVELS[i].xpNeeded) {
      level = i;
      break;
    }
  }
  return { ...LEVELS[level], index: level };
}

export default function ProgressPage({ state, translations, getSummary, getProgress }) {
  const xp = state.xp;
  const current = getCurrentLevel(xp);
  const next = LEVELS[Math.min(current.index + 1, LEVELS.length - 1)];
  const xpPercent = next.xpNeeded > 0 ? clamp(Math.round((xp / next.xpNeeded) * 100), 0, 100) : 100;
  const internships = state.results.slice(0, 4);
  const summary = getSummary(state);

  return (
    <>
      <div className="section-head">
        <h2>{translations.progressHead}</h2>
        <p>{translations.progressSub}</p>
      </div>

      <div className="xp-card">
        <div className="xp-top">
          <div className="level-badge">
            <span className="level-icon">{current.icon}</span>
            <div className="level-text">
              <h3>{current.name}</h3>
              <p>{translations.level} {current.index + 1}</p>
            </div>
          </div>
          <div className="xp-total">{formatNumber(xp)}<span>{translations.totalXP}</span></div>
        </div>
        <div className="xp-bar-bg">
          <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
        </div>
        <div className="xp-labels">
          <span>{formatNumber(xp)} XP earned</span>
          <span>{translations.nextLevel}: {formatNumber(next.xpNeeded)} XP</span>
        </div>
      </div>

      <div className="stats-strip">
        <div className="stat-box"><span className="stat-num">{summary.unlocked}</span><span className="stat-lbl">Unlocked Roles</span></div>
        <div className="stat-box"><span className="stat-num">{summary.applied}</span><span className="stat-lbl">Applications</span></div>
        <div className="stat-box"><span className="stat-num">{state.completedCourses.size}</span><span className="stat-lbl">Roadmap Steps</span></div>
      </div>

      <div className="sub-head"><h3>Readiness tracker</h3></div>
      <div className="readiness-list">
        {internships.length === 0 ? (
          <div className="empty-state"><div className="icon">Target</div><p>{translations.completeProfile}</p></div>
        ) : internships.map(item => {
          const progress = getProgress(item);
          const applied = state.appliedInternships.has(item.id);
          return (
            <div className="readiness-item" key={item.id}>
              <div className="readiness-top">
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.org}</span>
                </div>
                <span className={`readiness-state ${applied ? 'done' : progress.unlocked ? 'ready' : ''}`}>
                  {applied ? 'Applied' : progress.unlocked ? 'Ready' : `${progress.percent}%`}
                </span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="sub-head" style={{ marginTop: 22 }}>
        <h3>{translations.activityLog}</h3>
        <span className="count">{state.activities.length}</span>
      </div>
      {state.activities.length === 0 ? (
        <div className="empty-state"><div className="icon">Log</div><p>{translations.completeProfile}</p></div>
      ) : (
        <div className="activity-list">
          {state.activities.slice(-8).reverse().map(activity => (
            <div className="activity-item" key={activity.id}>
              <div className={`activity-dot ${activity.color}`} aria-hidden="true" />
              <div className="activity-text">{activity.text}</div>
              <div className="activity-xp">+{activity.xp} XP</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
