/**
 * SkillGapBanner — Shows near-miss gap warning inside a card.
 */
const SkillGapBanner = {
  render(missingSkills, skillLabels) {
    if (!missingSkills || missingSkills.length === 0) return '';
    return `
      <div class="skill-gap-banner" role="alert" aria-live="polite">
        <div class="gap-icon">⚡</div>
        <div class="gap-body">
          <strong>Almost there!</strong> Close ${missingSkills.length} skill gap${missingSkills.length > 1 ? 's' : ''} to become eligible:
          <div class="gap-chips" style="margin-top:6px">
            ${missingSkills.map(s => `<span class="gap-chip">${skillLabels[s] || s}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }
};