const PREFIX = 'pmis_';

export const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
      return true;
    } catch {
      return false;
    }
  },
  clear() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(PREFIX))
        .forEach(key => localStorage.removeItem(key));
      return true;
    } catch {
      return false;
    }
  },
};
