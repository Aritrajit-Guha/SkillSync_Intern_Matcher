/**
 * InternshipCard — Renders a single internship match card.
 */
const InternshipCard = {
  SKILL_LABELS: {
    communication: 'Communication', finance: 'Finance', excel: 'MS Excel',
    digital: 'Digital Literacy', data: 'Data Analysis', coding: 'Coding'
  },

  render(internship, index, translations) {
    const T = translations;
    const { title, org, icon, stipend, duration, location, seats,
            score, status, missingSkills } = internship;

    const statusLabel = status === 'eligible' ? T.statusEligible
                      : status === 'near-miss' ? T.statusNear : T.statusGap;
    const statusClass = status === 'eligible' ? 'eligible'
                      : status === 'near-miss' ? 'near' : 'gap';
    const matchClass  = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
    const btnLabel    = status === 'eligible' ? T.applyNow
                      : status === 'near-miss' ? T.viewRoadmap : T.learnFirst;
    const btnClass    = status === 'eligible' ? 'apply'
                      : status === 'near-miss' ? 'roadmap' : 'learn';
    const btnAction   = status === 'eligible'
      ? `App.onApply('${internship.id}')`
      : `App.onRoadmap('${internship.id}')`;

    const gapHtml = missingSkills.length > 0 ? `
      <div class="gap-chips" aria-label="${T.gapLabel}">
        ${missingSkills.map(s => `<span class="gap-chip">🔴 ${this.SKILL_LABELS[s] || s}</span>`).join('')}
      </div>
    ` : '';

    return `
      <article class="i-card ${status}" style="animation-delay:${index * 0.08}s" aria-label="${title} at ${org}">
        <div class="card-top">
          <div class="card-icon" aria-hidden="true">${icon}</div>
          <div class="card-info">
            <div class="card-title">${sanitize(title)}</div>
            <div class="card-org">${sanitize(org)}</div>
          </div>
          <div class="match-pill ${matchClass}" aria-label="Match score ${score}%">${score}%</div>
        </div>
        <div class="card-meta" aria-label="Internship details">
          <span class="meta-tag">💰 ${stipend}</span>
          <span class="meta-tag">⏱ ${duration}</span>
          <span class="meta-tag">📍 ${location}</span>
          <span class="meta-tag">👥 ${seats} seats</span>
        </div>
        ${gapHtml}
        <div class="card-footer">
          <span class="status-badge ${statusClass}" aria-label="Status: ${statusLabel}">${statusLabel}</span>
          <button class="card-action ${btnClass}" onclick="${btnAction}" aria-label="${btnLabel}">${btnLabel}</button>
        </div>
      </article>
    `;
  }
};