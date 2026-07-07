import { apiFetch } from '../shared/api';

export const workerService = {
  getAll: () => apiFetch('/workers'),
  getActive: () => apiFetch('/workers/active'),
  getArchived: () => apiFetch('/workers/archived'),
  getById: (workerID) => apiFetch(`/workers/${workerID}`),
  create: (payload) => apiFetch('/workers', { method: 'POST', body: JSON.stringify(payload) }),
  update: (workerID, payload) => apiFetch(`/workers/${workerID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archive: (workerID) => apiFetch(`/workers/${workerID}/archive`, { method: 'PATCH' }),
  restore: (workerID) => apiFetch(`/workers/${workerID}/restore`, { method: 'PATCH' }),
};
