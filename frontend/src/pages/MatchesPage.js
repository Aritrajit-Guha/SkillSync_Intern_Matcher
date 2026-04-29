/**
 * MatchesPage - Professional match list with progress summary.
 */
const MatchesPage = {
  render(state) {
    const sec = document.getElementById('sec-matches');
    if (!sec) return;
    const T = state.translations;
    const results = state.results;
    const summary = App.getCandidateSummary();

    if (results.length === 0) {
      sec.innerHTML = `
        <div class="section-head">
          <h2>${T.matchHead}</h2>
          <p>${T.noMatches}</p>
        </div>
        <div class="empty-state">
          <div class="icon">🔍</div>
          <p>${T.noMatches}</p>
        </div>
      `;
      return;
    }

    sec.innerHTML = `
      <div class="section-head">
        <h2>${T.matchHead}</h2>
        <p>${results.length} ${T.matchSub}</p>
      </div>

      <div class="stats-strip">
        <div class="stat-box">
          <span class="stat-num">${summary.total}</span>
          <span class="stat-lbl">Shortlisted</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">${summary.unlocked}</span>
          <span class="stat-lbl">Apply Ready</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">${summary.applied}</span>
          <span class="stat-lbl">Applied</span>
        </div>
      </div>

      <div class="cards-grid">
        ${results.map((item, index) => InternshipCard.render(item, index, T)).join('')}
      </div>
    `;
  }
};
