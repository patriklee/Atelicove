import { apiFetch, apiDownload } from '../shared/api';

export const projectService = {
  getAll: () => apiFetch('/projects'),
  getActive: () => apiFetch('/projects/active'),
  getArchived: () => apiFetch('/projects/archived'),
  getById: (projectID) => apiFetch(`/projects/${projectID}`),
  create: (payload) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  update: (projectID, payload) => apiFetch(`/projects/${projectID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archive: (projectID) => apiFetch(`/projects/${projectID}/archive`, { method: 'PATCH' }),
  restore: (projectID) => apiFetch(`/projects/${projectID}/restore`, { method: 'PATCH' }),
  launchDraft: (projectID, payload = {}) => apiFetch(`/projects/${projectID}/launch`, { method: 'POST', body: JSON.stringify(payload) }),
  addPlannedTeam: (projectID, teamID) => apiFetch(`/projects/${projectID}/planned-teams/${teamID}`, { method: 'POST' }),
  removePlannedTeam: (projectID, teamID) => apiFetch(`/projects/${projectID}/planned-teams/${teamID}`, { method: 'DELETE' }),
  downloadDocument: (projectID, documentID) => apiDownload(`/projects/${projectID}/documents/${documentID}/download`),
};
