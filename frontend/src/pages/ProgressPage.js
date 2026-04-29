/**
 * ProgressPage - Gamified progress dashboard with readiness tracking.
 */
const ProgressPage = {
  LEVELS: [
    { name: 'Starter', icon: '🌱', xpNeeded: 0 },
    { name: 'Explorer', icon: '🧭', xpNeeded: 60 },
    { name: 'Builder', icon: '🛠️', xpNeeded: 180 },
    { name: 'Achiever', icon: '🏅', xpNeeded: 360 },
    { name: 'Candidate Pro', icon: '🚀', xpNeeded: 600 }
  ],

  getCurrentLevel(xp) {
    let level = 0;
    for (let i = this.LEVELS.length - 1; i >= 0; i--) {
      if (xp >= this.LEVELS[i].xpNeeded) { level = i; break; }
    }
    return { ...this.LEVELS[level], index: level };
  },

  render(state) {
    const sec = document.getElementById('sec-progress');
    if (!sec) return;

    const T = state.translations;
    const xp = state.xp;
    const current = this.getCurrentLevel(xp);
    const next = this.LEVELS[Math.min(current.index + 1, this.LEVELS.length - 1)];
    const xpPercent = next.xpNeeded > 0 ? clamp(Math.round((xp / next.xpNeeded) * 100), 0, 100) : 100;
    const internships = state.results.slice(0, 4);
    const summary = App.getCandidateSummary();

    sec.innerHTML = `
      <div class="section-head">
        <h2>${T.progressHead}</h2>
        <p>${T.progressSub}</p>
      </div>

      <div class="xp-card">
        <div class="xp-top">
          <div class="level-badge">
            <span class="level-icon">${current.icon}</span>
            <div class="level-text">
              <h3>${current.name}</h3>
              <p>${T.level} ${current.index + 1}</p>
            </div>
          </div>
          <div class="xp-total">${formatNumber(xp)}<span>${T.totalXP}</span></div>
        </div>
        <div class="xp-bar-bg">
          <div class="xp-bar-fill" style="width:${xpPercent}%"></div>
        </div>
        <div class="xp-labels">
          <span>${formatNumber(xp)} XP earned</span>
          <span>${T.nextLevel}: ${formatNumber(next.xpNeeded)} XP</span>
        </div>
      </div>

      <div class="stats-strip">
        <div class="stat-box">
          <span class="stat-num">${summary.unlocked}</span>
          <span class="stat-lbl">Unlocked Roles</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">${summary.applied}</span>
          <span class="stat-lbl">Applications</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">${state.completedCourses.size}</span>
          <span class="stat-lbl">Roadmap Steps</span>
        </div>
      </div>

      <div class="sub-head"><h3>Readiness tracker</h3></div>
      <div class="readiness-list">
        ${internships.length === 0 ? `
          <div class="empty-state"><div class="icon">🎯</div><p>${T.completeProfile}</p></div>
        ` : internships.map(item => {
          const progress = App.getInternshipProgress(item);
          const applied = state.appliedInternships.has(item.id);
          return `
            <div class="readiness-item">
              <div class="readiness-top">
                <div>
                  <strong>${sanitize(item.title)}</strong>
                  <span>${sanitize(item.org)}</span>
                </div>
                <span class="readiness-state ${applied ? 'done' : progress.unlocked ? 'ready' : ''}">
                  ${applied ? 'Applied' : progress.unlocked ? 'Ready' : `${progress.percent}%`}
                </span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width:${progress.percent}%"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="sub-head" style="margin-top:22px"><h3>${T.activityLog}</h3><span class="count">${state.activities.length}</span></div>
      ${state.activities.length === 0 ? `
        <div class="empty-state"><div class="icon">📘</div><p>${T.completeProfile}</p></div>
      ` : `
        <div class="activity-list">
          ${state.activities.slice(-8).reverse().map(activity => `
            <div class="activity-item">
              <div class="activity-dot ${activity.color}" aria-hidden="true"></div>
              <div class="activity-text">${sanitize(activity.text)}</div>
              <div class="activity-xp">+${activity.xp} XP</div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }
};
