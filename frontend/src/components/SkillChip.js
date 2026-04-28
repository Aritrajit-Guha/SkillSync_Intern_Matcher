/**
 * SkillChip — Renders a toggleable skill or sector chip.
 */
const SkillChip = {
  render({ value, label, selected, type, onToggle }) {
    return `
      <div
        class="chip${selected ? ' selected' : ''}"
        onclick="${onToggle}('${value}')"
        id="chip-${type}-${value}"
        role="checkbox"
        aria-checked="${selected}"
        tabindex="0"
        onkeydown="if(event.key==='Enter'||event.key===' '){${onToggle}('${value}')}"
      >${selected ? '✓ ' : ''}${sanitize(label)}</div>
    `;
  },

  update(type, value, selected) {
    const el = document.getElementById(`chip-${type}-${value}`);
    if (!el) return;
    el.classList.toggle('selected', selected);
    el.setAttribute('aria-checked', selected);
    el.textContent = (selected ? '✓ ' : '') + el.textContent.replace(/^✓\s/, '');
  }
};