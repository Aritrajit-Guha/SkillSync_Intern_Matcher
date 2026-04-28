/**
 * storage.js — Thin localStorage wrapper with JSON support and fallback.
 */
const Storage = (() => {
  const PREFIX = 'pmis_';

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch { return false; }
  }

  function remove(key) {
    try { localStorage.removeItem(PREFIX + key); return true; }
    catch { return false; }
  }

  function clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
      return true;
    } catch { return false; }
  }

  return { get, set, remove, clear };
})();