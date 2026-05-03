import { clamp } from '../utils/helpers.js';

export default function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? clamp(Math.round((value / max) * 100), 0, 100) : 0;
  return (
    <div className="progress-wrap">
      <div className="progress-row">
        <span>{label}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
