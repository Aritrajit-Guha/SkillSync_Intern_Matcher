/**
 * RoadmapStep — Renders a skill group header within the roadmap.
 */
const RoadmapStep = {
  render(skillId, skillLabel, courseCount, stepIndex) {
    return `
      <div class="roadmap-step-header" aria-label="Skill: ${skillLabel}">
        <div class="step-indicator">
          <div class="step-circle">${stepIndex + 1}</div>
          ${stepIndex < courseCount - 1 ? '<div class="step-line"></div>' : ''}
        </div>
        <div class="step-content">
          <div class="sub-head">
            <h3>${sanitize(skillLabel)}</h3>
            <span class="count">${courseCount} courses</span>
          </div>
        </div>
      </div>
    `;
  }
};