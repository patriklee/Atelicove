import { apiFetch } from '../shared/api';

export const teamService = {
  getAll: () => apiFetch('/teams'),
  getById: (teamID) => apiFetch(`/teams/${teamID}`),
  create: (payload) => apiFetch('/teams', { method: 'POST', body: JSON.stringify(payload) }),
  update: (teamID, payload) => apiFetch(`/teams/${teamID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (teamID) => apiFetch(`/teams/${teamID}`, { method: 'DELETE' }),
};
