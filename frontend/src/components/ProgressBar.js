/**
 * ProgressBar — Reusable animated progress bar.
 */
const ProgressBar = {
  render({ value, max, label, showLabel = true, colorClass = '' }) {
    const pct = max > 0 ? clamp(Math.round((value / max) * 100), 0, 100) : 0;
    return `
      <div class="progress-wrap">
        ${showLabel ? `
          <div class="progress-labels">
            <span>${label || ''}</span>
            <span>${value}/${max}</span>
          </div>
        ` : ''}
        <div class="xp-bar-bg" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${label || 'Progress'}">
          <div class="xp-bar-fill ${colorClass}" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }
};