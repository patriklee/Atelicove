import { apiFetch, apiDownload } from '../shared/api';

export const projectService = {
  getAll: () => apiFetch('/projects'),
  getActive: () => apiFetch('/projects'),
  getArchived: () => apiFetch('/projects/archived'),
  getById: (projectID) => apiFetch(`/projects/${projectID}`),
  create: (payload) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  update: (projectID, payload) => apiFetch(`/projects/${projectID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archive: (projectID) => apiFetch(`/projects/${projectID}`, { method: 'DELETE' }),
  restore: (projectID) => apiFetch(`/projects/${projectID}/restore`, { method: 'PUT' }),
  downloadDocument: (projectID, documentID) => apiDownload(`/projects/${projectID}/documents/${documentID}/download`),
};
