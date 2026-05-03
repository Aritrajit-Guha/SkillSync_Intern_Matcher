import InternshipCard from '../components/InternshipCard.jsx';

export default function MatchesPage({ state, translations, skillLabels, getSummary, getProgress, getAction }) {
  const results = state.results;
  const summary = getSummary(state);

  if (results.length === 0) {
    return (
      <>
        <div className="section-head">
          <h2>{translations.matchHead}</h2>
          <p>{translations.noMatches}</p>
        </div>
        <div className="empty-state">
          <div className="icon">Search</div>
          <p>{translations.noMatches}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="section-head">
        <h2>{translations.matchHead}</h2>
        <p>{results.length} {translations.matchSub}</p>
      </div>

      <div className="stats-strip">
        <div className="stat-box"><span className="stat-num">{summary.total}</span><span className="stat-lbl">Shortlisted</span></div>
        <div className="stat-box"><span className="stat-num">{summary.unlocked}</span><span className="stat-lbl">Apply Ready</span></div>
        <div className="stat-box"><span className="stat-num">{summary.applied}</span><span className="stat-lbl">Applied</span></div>
      </div>

      <div className="cards-grid">
        {results.map((item, index) => (
          <InternshipCard
            key={item.id}
            internship={item}
            index={index}
            translations={translations}
            skillLabels={skillLabels}
            progress={getProgress(item)}
            action={getAction(item)}
            applied={state.appliedInternships.has(item.id)}
          />
        ))}
      </div>
    </>
  );
}
