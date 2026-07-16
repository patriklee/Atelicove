import { projectService } from './projectService';
import { apiFetch } from '../shared/api';

export const draftService = {
  getDrafts: () => apiFetch('/draft-projects'),
  getArchived: () => apiFetch('/draft-projects/archived'),
  launchDraft: projectService.launchDraft,
  archive: (draftProjectID) => apiFetch(`/draft-projects/${draftProjectID}`, { method: 'DELETE' }),
  restore: (draftProjectID) => apiFetch(`/draft-projects/${draftProjectID}/restore`, { method: 'PUT' }),
};
