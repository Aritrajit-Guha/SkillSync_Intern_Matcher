/**
 * MilestoneBadge — Single badge tile for the gamification grid.
 */
const MilestoneBadge = {
  BADGES: [
    { id: 'first_profile', icon: '🌱', name: 'Profile\nCreated',  xpRequired: 0   },
    { id: 'first_match',   icon: '📋', name: 'First\nMatch',      xpRequired: 10  },
    { id: 'learner',       icon: '📚', name: 'Course\nStarted',   xpRequired: 50  },
    { id: 'achiever',      icon: '⭐', name: 'Halfway\nThere',    xpRequired: 150 },
    { id: 'champion',      icon: '🏆', name: 'Fully\nReady',      xpRequired: 300 }
  ],

  render(badge, currentXP) {
    const earned = currentXP >= badge.xpRequired;
    return `
      <div class="badge-item${earned ? ' earned' : ''}" aria-label="${badge.name.replace('\n',' ')}: ${earned ? 'Earned' : `Requires ${badge.xpRequired} XP`}" role="img">
        <span class="badge-icon" aria-hidden="true">${badge.icon}</span>
        <div class="badge-name">${badge.name.replace('\n','<br>')}</div>
        ${!earned ? `<div class="badge-lock" aria-hidden="true">🔒</div>` : ''}
      </div>
    `;
  },

  renderAll(currentXP) {
    return this.BADGES.map(b => this.render(b, currentXP)).join('');
  }
};