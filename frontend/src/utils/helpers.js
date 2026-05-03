export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function fireConfetti(count = 40) {
  const colors = ['#f97316', '#10b981', '#f59e0b', '#38bdf8', '#f43f5e', '#a78bfa'];
  for (let i = 0; i < count; i += 1) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left:${Math.random() * 100}vw;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay:${Math.random() * 0.6}s;
      animation-duration:${1.5 + Math.random() * 1.5}s;
      width:${6 + Math.random() * 8}px;
      height:${6 + Math.random() * 8}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
}

export function showToast(message, duration = 2800) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN');
}
