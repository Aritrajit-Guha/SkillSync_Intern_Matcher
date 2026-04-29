/**
 * EligibleBanner - Shows when roadmap completion unlocks application.
 */
const EligibleBanner = {
  render(internshipTitle, visible, translations) {
    const T = translations;
    return `
      <div class="unlock-banner${visible ? ' show' : ''}" role="alert" aria-live="polite">
        <div class="unlock-emoji">🎉</div>
        <h4>${T.nowEligible}</h4>
        <p>${T.nowEligibleSub}</p>
        ${internshipTitle ? `<p class="unlock-title">${sanitize(internshipTitle)}</p>` : ''}
        <div class="unlock-actions">
          <button class="btn-secondary" onclick="App.goStep(2)" style="margin-top:14px">${T.backToApply}</button>
          <button class="btn-primary" onclick="App.openApplyPage('${APP_STATE.roadmapFor}')" style="margin-top:14px">Continue to Apply</button>
        </div>
      </div>
    `;
  }
};
