import { apiDownload, apiFetch } from '../shared/api';

export const documentService = {
  getAll: () => apiFetch('/documents'),
  downloadWorkOrderDocument: (workOrderID, documentID) => apiDownload(`/workorders/${workOrderID}/documents/${documentID}/download`),
  downloadProjectDocument: (projectID, documentID) => apiDownload(`/projects/${projectID}/documents/${documentID}/download`),
  deleteWorkOrderDocument: (workOrderID, documentID) => apiFetch(`/workorders/${workOrderID}/documents/${documentID}`, { method: 'DELETE' }),
  deleteProjectDocument: (projectID, documentID) => apiFetch(`/projects/${projectID}/documents/${documentID}`, { method: 'DELETE' }),
};
