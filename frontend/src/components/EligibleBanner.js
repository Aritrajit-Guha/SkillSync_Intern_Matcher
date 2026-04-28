/**
 * EligibleBanner — Shows "now eligible" success banner after roadmap completion.
 */
const EligibleBanner = {
  render(internshipTitle, visible, translations) {
    const T = translations;
    return `
      <div class="unlock-banner${visible ? ' show' : ''}" id="unlock-banner" role="alert" aria-live="assertive">
        <div style="font-size:32px;margin-bottom:8px">🎉</div>
        <h4>${T.nowEligible}</h4>
        <p>${T.nowEligibleSub}</p>
        ${internshipTitle ? `<p style="font-size:11px;color:var(--saffron);margin-top:4px;font-weight:600">${sanitize(internshipTitle)}</p>` : ''}
        <button class="btn-secondary" onclick="App.goStep(2)" style="margin-top:12px">
          ${T.backToApply}
        </button>
      </div>
    `;
  }
};