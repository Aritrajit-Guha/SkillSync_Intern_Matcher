/**
 * MatchesPage — Shows ranked internship match cards.
 */
const MatchesPage = {
  render(state) {
    const sec = document.getElementById('sec-matches');
    if (!sec) return;
    const T = state.translations;
    const results = state.results;

    if (results.length === 0) {
      sec.innerHTML = `
        <div class="section-head"><h2>${T.matchHead}</h2></div>
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
        <p><span class="accent">${results.length}</span> ${T.matchSub}</p>
      </div>
      <div class="cards-grid" id="cards-grid">
        ${results.map((r, i) => InternshipCard.render(r, i, T)).join('')}
      </div>
    `;
  }
};