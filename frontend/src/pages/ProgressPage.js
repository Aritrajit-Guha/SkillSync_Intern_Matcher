/**
 * ProgressPage — Gamification dashboard: XP, levels, badges, activity log.
 */
const ProgressPage = {
  LEVELS: [
    { name: 'Beginner',  icon: '🌱', xpNeeded: 0   },
    { name: 'Explorer',  icon: '🔍', xpNeeded: 50  },
    { name: 'Learner',   icon: '📚', xpNeeded: 150 },
    { name: 'Achiever',  icon: '⭐', xpNeeded: 300 },
    { name: 'Champion',  icon: '🏅', xpNeeded: 500 },
    { name: 'Expert',    icon: '🏆', xpNeeded: 750 }
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
    const xp  = state.xp;
    const lvl = this.getCurrentLevel(xp);
    const nextLvl = this.LEVELS[Math.min(lvl.index + 1, this.LEVELS.length - 1)];
    const pct = nextLvl.xpNeeded > 0
      ? clamp(Math.round((xp / nextLvl.xpNeeded) * 100), 0, 100)
      : 100;

    sec.innerHTML = `
      <div class="section-head">
        <h2>${T.progressHead}</h2>
        <p>${T.progressSub}</p>
      </div>

      <div class="xp-card">
        <div class="xp-top">
          <div class="level-badge">
            <span class="level-icon" aria-hidden="true">${lvl.icon}</span>
            <div class="level-text">
              <h3>${lvl.name}</h3>
              <p>${T.level} ${lvl.index + 1}</p>
            </div>
          </div>
          <div class="xp-total" aria-label="${xp} total XP">
            ${formatNumber(xp)}<span>${T.totalXP}</span>
          </div>
        </div>
        <div class="xp-bar-wrap">
          <div class="xp-bar-bg" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="XP progress">
            <div class="xp-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="xp-labels">
            <span>${formatNumber(xp)} XP</span>
            <span>${T.nextLevel}: ${formatNumber(nextLvl.xpNeeded)} → ${nextLvl.name} ${nextLvl.icon}</span>
          </div>
        </div>
      </div>

      <div class="sub-head"><h3>🏅 ${T.badges}</h3></div>
      <div class="badges-grid" aria-label="Achievement badges">
        ${MilestoneBadge.renderAll(xp)}
      </div>

      <div class="sub-head" style="margin-top:22px">
        <h3>📋 ${T.activityLog}</h3>
        <span class="count">${state.activities.length}</span>
      </div>
      ${state.activities.length === 0
        ? `<div class="empty-state"><div class="icon">🎯</div><p>${T.completeProfile}</p></div>`
        : `<div class="activity-list">
            ${state.activities.slice(-8).reverse().map(a => `
              <div class="activity-item">
                <div class="activity-dot ${a.color}" aria-hidden="true"></div>
                <div class="activity-text">${sanitize(a.text)}</div>
                <div class="activity-xp" aria-label="+${a.xp} XP">+${a.xp} XP</div>
              </div>
            `).join('')}
          </div>`
      }
    `;
  }
};