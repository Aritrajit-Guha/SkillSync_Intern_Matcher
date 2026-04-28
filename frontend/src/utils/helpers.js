/**
 * helpers.js — Pure utility functions.
 */

/** Safely get a translation key */
function t(key) {
  if (window.APP_STATE && window.APP_STATE.translations) {
    return window.APP_STATE.translations[key] || key;
  }
  return key;
}

/** Debounce a function call */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Clamp value between min and max */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/** Generate a simple unique ID */
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/** Sanitize HTML to prevent XSS */
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Show confetti burst */
function fireConfetti(count = 40) {
  const colors = ['#f97316','#10b981','#f59e0b','#38bdf8','#f43f5e','#a78bfa'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left:${Math.random()*100}vw;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-delay:${Math.random()*0.6}s;
      animation-duration:${1.5 + Math.random()*1.5}s;
      width:${6 + Math.random()*8}px;
      height:${6 + Math.random()*8}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
}

/** Show a toast notification */
function showToast(msg, duration = 2800) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

/** Scroll element into view smoothly */
function scrollTo(el) {
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Format a number with comma separators */
function formatNumber(n) {
  return n.toLocaleString('en-IN');
}