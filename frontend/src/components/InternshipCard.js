/**
 * InternshipCard - Professional internship card with apply and roadmap state.
 */
const InternshipCard = {
  render(internship, index, translations) {
    const T = translations;
    const progress = App.getInternshipProgress(internship);
    const action = App.getInternshipAction(internship);
    const applied = APP_STATE.appliedInternships.has(internship.id);
    const locationLabel = internship.location || internship.state || 'India';
    const perks = (internship.perks || []).slice(0, 2);

    return `
      <article class="i-card ${internship.status}" style="animation-delay:${index * 0.05}s" aria-label="${sanitize(internship.title)} at ${sanitize(internship.org)}">
        <div class="card-top">
          <div class="card-icon" aria-hidden="true">${internship.icon || '💼'}</div>
          <div class="card-info">
            <div class="card-title">${sanitize(internship.title)}</div>
            <div class="card-org">${sanitize(internship.org)} • ${sanitize(internship.jobType || internship.duration || '')}</div>
          </div>
          <div class="match-pill ${internship.score >= 75 ? 'high' : internship.score >= 50 ? 'mid' : 'low'}">${internship.score}%</div>
        </div>

        <div class="card-meta">
          <span class="meta-tag">📍 ${sanitize(locationLabel)}</span>
          <span class="meta-tag">💸 ${sanitize(internship.stipend)}</span>
          <span class="meta-tag">🧭 ${sanitize(internship.experience || 'Entry-level')}</span>
        </div>

        <div class="skill-line">
          ${(internship.skills || []).slice(0, 5).map(skill => `<span class="mini-chip">${sanitize(SKILL_LABELS[skill] || skill)}</span>`).join('')}
        </div>

        ${progress.percent < 100 ? `
          <div class="roadmap-mini">
            <div class="roadmap-mini-top">
              <span>${progress.done}/${progress.total || 0} roadmap steps complete</span>
              <strong>${progress.percent}% ready</strong>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width:${progress.percent}%"></div>
            </div>
          </div>
        ` : `
          <div class="roadmap-mini roadmap-mini-ready">
            <strong>${applied ? 'Application submitted' : 'Ready to apply'}</strong>
            <span>${applied ? 'This internship has already been marked as applied.' : 'All skill gaps are complete.'}</span>
          </div>
        `}

        ${internship.missingSkills.length > 0 && progress.percent < 100 ? `
          <div class="gap-chips" aria-label="${T.gapLabel}">
            ${internship.missingSkills.slice(0, 3).map(skill => `<span class="gap-chip">${sanitize(SKILL_LABELS[skill] || skill)}</span>`).join('')}
          </div>
        ` : ''}

        <div class="perk-row">
          ${perks.map(perk => `<span class="perk-pill">${sanitize(perk)}</span>`).join('')}
        </div>

        <div class="card-footer">
          <span class="status-badge ${progress.unlocked ? 'eligible' : internship.status === 'near-miss' ? 'near' : internship.status === 'gap' ? 'gap' : 'eligible'}">
            ${progress.unlocked ? T.statusEligible : internship.status === 'near-miss' ? T.statusNear : internship.status === 'gap' ? T.statusGap : T.statusEligible}
          </span>
          <button class="card-action ${action.className}" ${action.disabled ? 'disabled' : ''} ${action.action ? `onclick="${action.action}"` : ''}>
            ${action.label}
          </button>
        </div>
      </article>
    `;
  }
};
