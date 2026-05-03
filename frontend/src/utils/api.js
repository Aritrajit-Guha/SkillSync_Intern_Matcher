const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TIMEOUT = 5000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

function localRecommendations(profile, internships) {
  const profileSkills = new Set(profile.skills || []);
  return internships.map(item => {
    const missingSkills = (item.skills || []).filter(skill => !profileSkills.has(skill));
    return {
      ...item,
      missingSkills,
      status: missingSkills.length === 0 ? 'eligible' : missingSkills.length <= 2 ? 'near-miss' : 'gap',
    };
  });
}

export const API = {
  async getRecommendations(profile, fallbackInternships = []) {
    try {
      return await fetchWithTimeout(`${BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch {
      return { results: localRecommendations(profile, fallbackInternships), source: 'local' };
    }
  },
  async saveProgress(data) {
    return fetchWithTimeout(`${BASE}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};
