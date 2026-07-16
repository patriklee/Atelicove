import { apiFetch, apiDownload } from '../shared/api';

export const workOrderService = {
  getAll: () => apiFetch('/workorders/all-with-archived'),
  getActive: () => apiFetch('/workorders'),
  getArchived: () => apiFetch('/workorders/archived'),
  getById: (workOrderID) => apiFetch(`/workorders/${workOrderID}`),
  create: (payload) => apiFetch('/workorders', { method: 'POST', body: JSON.stringify(payload) }),
  archive: (workOrderID) => apiFetch(`/workorders/${workOrderID}`, { method: 'DELETE' }),
  restore: (workOrderID) => apiFetch(`/workorders/${workOrderID}/restore`, { method: 'PUT' }),
  addWorker: (workOrderID, workerID) => apiFetch(`/workorders/${workOrderID}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ workerID }),
  }),
  removeWorker: (workOrderID, workerID) => apiFetch(`/workorders/${workOrderID}/workers/${workerID}`, { method: 'DELETE' }),
  downloadDocument: (workOrderID, documentID) => apiDownload(`/workorders/${workOrderID}/documents/${documentID}/download`),
};
