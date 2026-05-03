export default function InternshipCard({
  internship,
  index,
  translations,
  skillLabels,
  progress,
  action,
  applied,
}) {
  const locationLabel = internship.location || internship.state || 'India';
  const perks = (internship.perks || []).slice(0, 2);
  const matchClass = internship.score >= 75 ? 'high' : internship.score >= 50 ? 'mid' : 'low';
  const statusClass = progress.unlocked
    ? 'eligible'
    : internship.status === 'near-miss'
      ? 'near'
      : internship.status === 'gap'
        ? 'gap'
        : 'eligible';
  const statusLabel = progress.unlocked
    ? translations.statusEligible
    : internship.status === 'near-miss'
      ? translations.statusNear
      : internship.status === 'gap'
        ? translations.statusGap
        : translations.statusEligible;

  return (
    <article
      className={`i-card ${internship.status}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      aria-label={`${internship.title} at ${internship.org}`}
    >
      <div className="card-top">
        <div className="card-icon" aria-hidden="true">{internship.icon || 'PM'}</div>
        <div className="card-info">
          <div className="card-title">{internship.title}</div>
          <div className="card-org">{internship.org} · {internship.jobType || internship.duration || ''}</div>
        </div>
        <div className={`match-pill ${matchClass}`}>{internship.score}%</div>
      </div>

      <div className="card-meta">
        <span className="meta-tag">Location: {locationLabel}</span>
        <span className="meta-tag">Stipend: {internship.stipend}</span>
        <span className="meta-tag">Experience: {internship.experience || 'Entry-level'}</span>
      </div>

      <div className="skill-line">
        {(internship.skills || []).slice(0, 5).map(skill => (
          <span className="mini-chip" key={skill}>{skillLabels[skill] || skill}</span>
        ))}
      </div>

      {progress.percent < 100 ? (
        <div className="roadmap-mini">
          <div className="roadmap-mini-top">
            <span>{progress.done}/{progress.total || 0} roadmap steps complete</span>
            <strong>{progress.percent}% ready</strong>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      ) : (
        <div className="roadmap-mini roadmap-mini-ready">
          <strong>{applied ? 'Application submitted' : 'Ready to apply'}</strong>
          <span>{applied ? 'This internship has already been marked as applied.' : 'All skill gaps are complete.'}</span>
        </div>
      )}

      {internship.missingSkills.length > 0 && progress.percent < 100 ? (
        <div className="gap-chips" aria-label={translations.gapLabel}>
          {internship.missingSkills.slice(0, 3).map(skill => (
            <span className="gap-chip" key={skill}>{skillLabels[skill] || skill}</span>
          ))}
        </div>
      ) : null}

      <div className="perk-row">
        {perks.map(perk => <span className="perk-pill" key={perk}>{perk}</span>)}
      </div>

      <div className="card-footer">
        <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
        <button
          className={`card-action ${action.className}`}
          disabled={action.disabled}
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      </div>
    </article>
  );
}
