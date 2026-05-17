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
  internshipMetadata() {
    return request('/internship-metadata');
  },
  refreshRecommendations(preferences = {}) {
    return request('/recommendations/refresh', { method: 'POST', body: JSON.stringify(preferences) });
  },
  updateProfile(payload) {
    return request('/profile', { method: 'PATCH', body: JSON.stringify(payload) });
  },
  getRoadmap(internshipId, skill, refresh = false) {
    const refreshParam = refresh ? '&refresh=1' : '';
    return request(`/roadmap/${internshipId}?skill=${encodeURIComponent(skill || '')}${refreshParam}`);
  },
  completeRoadmapLevel(internshipId, levelId, skill) {
    return request(`/roadmap/${internshipId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ levelId, skill }),
    });
  },
  chatRoadmap(internshipId, message, skill) {
    return request(`/roadmap/${internshipId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, skill }),
    });
  },
  apply(payload) {
    return request('/applications', { method: 'POST', body: JSON.stringify(payload) });
  },
};
