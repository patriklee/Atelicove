import { projectService } from './projectService';
import { apiFetch } from '../shared/api';

export const draftService = {
  getDrafts: () => apiFetch('/draft-projects'),
  getArchived: () => apiFetch('/draft-projects/archived'),
  getById: (draftProjectID) => apiFetch(`/draft-projects/${draftProjectID}`),
  create: (payload) => apiFetch('/draft-projects', { method: 'POST', body: JSON.stringify(payload) }),
  update: (draftProjectID, payload) => apiFetch(`/draft-projects/${draftProjectID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  launchDraft: projectService.launchDraft,
  archive: (draftProjectID) => apiFetch(`/draft-projects/${draftProjectID}`, { method: 'DELETE' }),
  restore: (draftProjectID) => apiFetch(`/draft-projects/${draftProjectID}/restore`, { method: 'PUT' }),
  deletePermanently: (draftProjectID) => apiFetch(`/draft-projects/${draftProjectID}/permanent`, { method: 'DELETE' }),
  createWorkOrder: (draftProjectID, payload) => apiFetch(`/draft-projects/${draftProjectID}/work-orders`, { method: 'POST', body: JSON.stringify(payload) }),
  updateWorkOrder: (draftProjectID, draftWorkOrderID, payload) => apiFetch(`/draft-projects/${draftProjectID}/work-orders/${draftWorkOrderID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteWorkOrder: (draftProjectID, draftWorkOrderID) => apiFetch(`/draft-projects/${draftProjectID}/work-orders/${draftWorkOrderID}`, { method: 'DELETE' }),
  createPlannedStaffing: (draftProjectID, payload) => apiFetch(`/draft-projects/${draftProjectID}/planned-staffing`, { method: 'POST', body: JSON.stringify(payload) }),
  updatePlannedStaffing: (draftProjectID, plannedStaffingID, payload) => apiFetch(`/draft-projects/${draftProjectID}/planned-staffing/${plannedStaffingID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePlannedStaffing: (draftProjectID, plannedStaffingID) => apiFetch(`/draft-projects/${draftProjectID}/planned-staffing/${plannedStaffingID}`, { method: 'DELETE' }),
};
