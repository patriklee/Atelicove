import { projectService } from './projectService';
import { apiFetch } from '../shared/api';

export const draftService = {
  getDrafts: () => apiFetch('/projects/drafts'),
  getDraft: (projectID) => projectService.getById(projectID),
  createDraft: (payload) => projectService.create({ ...payload, status: payload?.status || 'DRAFT' }),
  updateDraft: projectService.update,
  launchDraft: projectService.launchDraft,
  addPlannedTeam: projectService.addPlannedTeam,
  removePlannedTeam: projectService.removePlannedTeam,
};
