/**
 * LanguageToggle — Renders the language selector bar.
 */
const LanguageToggle = {
  LANGS: [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'mr', label: 'मराठी' },
    { code: 'ta', label: 'தமிழ்' }
  ],

  render(currentLang, onSelect) {
    const container = document.getElementById('lang-bar');
    if (!container) return;
    container.innerHTML = this.LANGS.map(({ code, label }) => `
      <button
        class="lang-btn${currentLang === code ? ' active' : ''}"
        onclick="LanguageToggle.select('${code}')"
        aria-pressed="${currentLang === code}"
        aria-label="Switch to ${label}"
      >${label}</button>
    `).join('');
    this._onSelect = onSelect;
  },

  select(code) {
    if (this._onSelect) this._onSelect(code);
  }
};