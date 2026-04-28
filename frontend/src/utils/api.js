/**
 * api.js — Backend API client with fallback to static data.
 */
const API = (() => {
  const BASE = window.API_BASE_URL || 'http://localhost:5000/api';
  const TIMEOUT = 5000;

  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  async function getRecommendations(profile) {
    try {
      return await fetchWithTimeout(`${BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch {
      // Fallback: run scoring client-side
      return { results: runLocalScoring(profile), source: 'local' };
    }
  }

  async function getCourses(skillId) {
    try {
      return await fetchWithTimeout(`${BASE}/courses/${skillId}`);
    } catch {
      return { courses: STATIC_COURSES[skillId] || [], source: 'local' };
    }
  }

  async function saveProgress(data) {
    try {
      return await fetchWithTimeout(`${BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch {
      Storage.set('progress', data);
      return { saved: true, source: 'local' };
    }
  }

  return { getRecommendations, getCourses, saveProgress };
})();