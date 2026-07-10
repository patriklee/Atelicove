import { normalizeWorker } from '../../model';

export const emptyProjectForm = {
  projectID: '',
  projectName: '',
  description: '',
  budget: '',
  teamIDs: [],
  associatedActiveProjectID: '',
};

export const emptyWorkOrderForm = {
  projectID: '',
  teamID: '',
  companyID: '',
  existingWorkOrderID: '',
  comment: '',
};

export const emptyActionItemForm = {
  projectID: '',
  actionItemID: '',
  itemText: '',
  assignedWorkerID: '',
  assignedTeamID: '',
};

export const commentTypes = ['GENERAL', 'QUESTION', 'DECISION', 'WARNING', 'UPDATE'];

export const normalizeProject = (project = {}) => ({
  ...project,
  projectID: project.projectID ?? project.projectId ?? 0,
  projectName: project.projectName ?? '',
  description: project.description ?? '',
  budget: project.budget ?? '',
  estimatedCost: project.estimatedCost ?? '',
  actualCost: project.actualCost ?? '',
  budgetDifference: project.budgetDifference ?? '',
  projectStatus: project.projectStatus ?? 'DRAFT',
  comments: Array.isArray(project.comments) ? project.comments : [],
  actionItems: Array.isArray(project.actionItems) ? project.actionItems : [],
  documents: Array.isArray(project.documents) ? project.documents : [],
  snapshots: Array.isArray(project.snapshots) ? project.snapshots : [],
  associatedActiveProject: project.associatedActiveProject || null,
  plannedStaffing: Array.isArray(project.plannedStaffing) ? project.plannedStaffing : [],
  plannedTeams: Array.isArray(project.plannedTeams)
    ? project.plannedTeams
    : (Array.isArray(project.plannedStaffing) ? project.plannedStaffing : []),
  teams: Array.isArray(project.teams) ? project.teams : [],
  workOrders: Array.isArray(project.workOrders) ? project.workOrders : [],
  draftWorkOrders: Array.isArray(project.draftWorkOrders) ? project.draftWorkOrders : [],
});

export const normalizeTeam = (team = {}) => ({
  ...team,
  teamID: team.teamID ?? team.teamId ?? 0,
  teamName: team.teamName ?? '',
  workers: Array.isArray(team.workers) ? team.workers.map(normalizeWorker) : [],
});

export const moneyOrBlank = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

export const workerName = (worker) =>
  `${worker.firstName || worker.workerFName || ''} ${worker.lastName || worker.workerLName || ''}`.trim() ||
  worker.displayName ||
  worker.workerDisplayName ||
  worker.username ||
  worker.workerUser ||
  'Unnamed worker';

export const workerRoleSummary = (worker = {}) =>
  worker.roleTitle || worker.role || worker.roleDescription || '';

export const formatMoney = (value) =>
  value === '' || value === null || value === undefined ? 'Not set' : `$${Number(value).toLocaleString()}`;

export const workOrderCost = (workOrder = {}) =>
  (workOrder.items || []).reduce((total, item) => (
    total + (Number(item.price) || 0) * (Number(item.quantity ?? 1) || 0)
  ), 0);

export const projectDraftEstimatedCost = (project = {}) =>
  (project.draftWorkOrders || []).reduce((total, workOrder) => total + workOrderCost(workOrder), 0);

export const projectWorkOrderCount = (project = {}) =>
  (project.workOrders || []).length +
  (project.draftWorkOrders || []).length ||
  project.workOrderCount ||
  project.draftWorkOrderCount ||
  0;

export const projectPayload = (form) => ({
  projectName: form.projectName.trim() || null,
  description: form.description.trim() || null,
  budget: moneyOrBlank(form.budget),
  teamIDs: form.teamIDs.map(Number),
  associatedActiveProjectID: form.associatedActiveProjectID ? Number(form.associatedActiveProjectID) : null,
});

export const actionItemPayload = (form) => ({
  itemText: form.itemText.trim(),
  assignedWorker: form.assignedWorkerID ? { workerID: Number(form.assignedWorkerID) } : null,
  assignedTeam: form.assignedTeamID ? { teamID: Number(form.assignedTeamID) } : null,
});
