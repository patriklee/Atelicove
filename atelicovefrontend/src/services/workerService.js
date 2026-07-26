import { apiFetch } from '../shared/api';

export const workerService = {
  getAllIncludingArchived: () => apiFetch('/workers/all-with-archived'),
  getActive: () => apiFetch('/workers'),
  getArchived: () => apiFetch('/workers/archived'),
  getById: (workerID) => apiFetch(`/workers/${workerID}`),
  create: (payload) => apiFetch('/workers', { method: 'POST', body: JSON.stringify(payload) }),
  update: (workerID, payload) => apiFetch(`/workers/${workerID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archive: (workerID) => apiFetch(`/workers/${workerID}`, { method: 'DELETE' }),
  restore: (workerID) => apiFetch(`/workers/${workerID}/restore`, { method: 'PUT' }),
};
