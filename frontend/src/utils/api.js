const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export const API = {
  me() {
    return request('/auth/me');
  },
  register(payload) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  login(payload) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  logout() {
    return request('/auth/logout', { method: 'POST' });
  },
  forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  updateSettings(payload) {
    return request('/auth/settings', { method: 'PATCH', body: JSON.stringify(payload) });
  },
  dashboard() {
    return request('/dashboard');
  },
  refreshRecommendations() {
    return request('/recommendations/refresh', { method: 'POST', body: JSON.stringify({}) });
  },
  updateProfile(payload) {
    return request('/profile', { method: 'PATCH', body: JSON.stringify(payload) });
  },
  getRoadmap(internshipId) {
    return request(`/roadmap/${internshipId}`);
  },
  completeRoadmapLevel(internshipId, levelId) {
    return request(`/roadmap/${internshipId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ levelId }),
    });
  },
  chatRoadmap(internshipId, message) {
    return request(`/roadmap/${internshipId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  apply(payload) {
    return request('/applications', { method: 'POST', body: JSON.stringify(payload) });
  },
};
