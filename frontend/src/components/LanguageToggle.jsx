export default function LanguageToggle({ languages, current, onChange }) {
  return (
    <nav className="lang-bar" aria-label="Language selector">
      {languages.map(language => (
        <button
          key={language.code}
          className={`lang-btn ${current === language.code ? 'active' : ''}`}
          onClick={() => onChange(language.code)}
          type="button"
        >
          {language.label}
        </button>
      ))}
    </nav>
  );
}
