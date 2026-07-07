import { apiFetch, apiDownload } from '../shared/api';

export const workOrderService = {
  getAll: () => apiFetch('/workorders'),
  getActive: () => apiFetch('/workorders/active'),
  getArchived: () => apiFetch('/workorders/archived'),
  getById: (workOrderID) => apiFetch(`/workorders/${workOrderID}`),
  create: (payload) => apiFetch('/workorders', { method: 'POST', body: JSON.stringify(payload) }),
  update: (workOrderID, payload) => apiFetch(`/workorders/${workOrderID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archive: (workOrderID) => apiFetch(`/workorders/${workOrderID}/archive`, { method: 'PATCH' }),
  restore: (workOrderID) => apiFetch(`/workorders/${workOrderID}/restore`, { method: 'PATCH' }),
  addWorker: (workOrderID, workerID) => apiFetch(`/workorders/${workOrderID}/workers/${workerID}`, { method: 'POST' }),
  removeWorker: (workOrderID, workerID) => apiFetch(`/workorders/${workOrderID}/workers/${workerID}`, { method: 'DELETE' }),
  downloadDocument: (workOrderID, documentID) => apiDownload(`/workorders/${workOrderID}/documents/${documentID}/download`),
};
