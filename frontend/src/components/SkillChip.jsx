export default function SkillChip({ value, label, selected, type, onToggle }) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle(value);
    }
  }

  return (
    <button
      id={`chip-${type}-${value}`}
      className={`chip${selected ? ' selected' : ''}`}
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={() => onToggle(value)}
      onKeyDown={handleKeyDown}
    >
      {selected ? '\u2713 ' : ''}{label}
    </button>
  );
}
