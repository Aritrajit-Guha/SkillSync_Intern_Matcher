export default function EligibleBanner({ title, unlocked, translations, onBack, onApply }) {
  if (!unlocked) return null;

  return (
    <div className="unlock-banner show" role="alert" aria-live="polite">
      <div className="unlock-emoji">{'\uD83C\uDF89'}</div>
      <h4>{translations.nowEligible || 'Application unlocked'}</h4>
      <p>{translations.nowEligibleSub || 'All skill gaps closed. You can now apply.'}</p>
      {title ? <p className="unlock-title">{title}</p> : null}
      <div className="unlock-actions">
        <button className="btn-secondary" onClick={onBack} type="button" style={{ marginTop: 14 }}>
          {translations.backToApply}
        </button>
        <button className="btn-primary" onClick={onApply} type="button" style={{ marginTop: 14 }}>
          Continue to Apply
        </button>
      </div>
    </div>
  );
}
