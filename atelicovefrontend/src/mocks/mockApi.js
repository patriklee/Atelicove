import { mockCompanies, mockWorkers, mockWorkOrders, mockTeams, mockProjects } from './mockData';

// Bump this whenever the bundled fixtures materially change so existing mock-mode
// sessions receive the new records instead of retaining an older localStorage copy.
const STORAGE_KEY = 'atelicoveMockApiStateV4';
const AUTHENTICATED_WORKER_KEY = 'atelicoveMockAuthenticatedWorkerID';
let mockSessionInitialized = false;

export const initializeMockSession = ({ startLoggedOut = false } = {}) => {
  if (mockSessionInitialized) return;
  mockSessionInitialized = true;

  if (startLoggedOut && typeof localStorage !== 'undefined') {
    // Development-only reset for reviewing startup, login, and splash behavior.
    localStorage.removeItem(AUTHENTICATED_WORKER_KEY);
  }
};

class MockApiError extends Error {
  constructor(message, status = 400, data = null) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
    this.data = data;
  }
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const toMockResponse = (value) => {
  if (Array.isArray(value)) return value.map(toMockResponse);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'workerPW')
      .map(([key, item]) => [key, toMockResponse(item)]),
  );
};

const withAuditDefaults = (item) => ({
  createdAt: item.createdAt || now(),
  lastModifiedAt: item.lastModifiedAt || item.createdAt || now(),
  archived: item.archived ?? false,
  archivedAt: item.archivedAt ?? null,
  ...item,
});

const withWorkerDefaults = (worker) => ({
  workerEmail: worker.workerEmail || `${worker.workerUser || `worker${worker.workerID}`}@example.test`,
  workerDisplayName: worker.workerDisplayName || '',
  lastLoginAt: worker.lastLoginAt || null,
  ...withAuditDefaults(worker),
});

const hydrateState = (rawState) => ({
  workers: (rawState.workers || []).map(withWorkerDefaults),
  companies: (rawState.companies || []).map(withAuditDefaults),
  teams: (rawState.teams || []).map(team => ({
    ...team,
    workers: (team.workers || []).map(withWorkerDefaults),
  })),
  projects: (rawState.projects || []).map(project => {
    const { changeLogs, ...cleanProject } = project;
    return {
      ...withAuditDefaults(cleanProject),
      teams: cleanProject.teams || [],
      workOrders: (cleanProject.workOrders || []).filter(order => ['OPEN', 'IN_PROCESS', 'IN_REVIEW', 'COMPLETE'].includes(order.status)),
      comments: cleanProject.comments || [],
      actionItems: cleanProject.actionItems || [],
      documents: (cleanProject.documents || []).map(withAuditDefaults),
      snapshots: cleanProject.snapshots || [],
    };
  }),
  workOrders: (rawState.workOrders || [])
    .filter(order => ['OPEN', 'IN_PROCESS', 'IN_REVIEW', 'COMPLETE'].includes(order.status))
    .map(order => ({
      ...withAuditDefaults(order),
      workers: (order.workers || []).map(withWorkerDefaults),
      company: order.company ? withAuditDefaults(order.company) : null,
      items: (order.items || []).map(withAuditDefaults),
      documents: (order.documents || []).map(withAuditDefaults),
    })),
});

const loadState = () => {
  if (typeof localStorage === 'undefined') {
    return hydrateState({
      workers: clone(mockWorkers),
      companies: clone(mockCompanies),
      teams: clone(mockTeams),
      projects: clone(mockProjects),
      workOrders: clone(mockWorkOrders),
    });
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const hydrated = hydrateState(JSON.parse(saved));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
      return hydrated;
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const initialState = hydrateState({
    workers: clone(mockWorkers),
    companies: clone(mockCompanies),
    teams: clone(mockTeams),
    projects: clone(mockProjects),
    workOrders: clone(mockWorkOrders),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
};

let state = loadState();

const saveState = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

const withoutPassword = ({ workerPW, ...worker }) => worker;
const activeOnly = (items) => items.filter(item => !item.archived);
const archivedOnly = (items) => items.filter(item => item.archived);

const nextId = (items, key) => Math.max(0, ...items.map(item => Number(item[key]) || 0)) + 1;

const bodyAsJson = (options) => {
  if (!options.body) return {};
  return typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
};

const normalizeMockPath = (path = '') => {
  let value = String(path || '');

  // Support callers that accidentally pass a full backend URL, e.g.
  // http://localhost:8080/workers. Mock routing only needs the pathname.
  try {
    if (/^https?:\/\//i.test(value)) {
      value = new URL(value).pathname;
    }
  } catch (error) {
    // Keep the original value if URL parsing fails.
  }

  value = value.split('?')[0];

  let segments = value.split('/').filter(Boolean);
  if (segments[0] === 'api') segments = segments.slice(1);

  const aliases = {
    worker: 'workers',
    company: 'companies',
    team: 'teams',
    project: 'projects',
    workorder: 'workorders',
    workorders: 'workorders',
    'work-order': 'workorders',
    'work-orders': 'workorders',
  };

  if (segments[0] && aliases[segments[0]]) {
    segments[0] = aliases[segments[0]];
  }

  return segments;
};

const allowedDocumentExtensionsByMimeType = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'text/plain': ['txt'],
};
const allowedDocumentTypes = ['GENERAL', 'CONTRACT', 'RECEIPT', 'INVOICE', 'REPORT', 'PHOTO', 'FORM', 'OTHER'];
const maxDocumentSize = 10 * 1024 * 1024;

const getDocumentExtension = (fileName = '') => fileName.split('.').pop()?.toLowerCase() || '';

const ensureDocumentFileIsAllowed = (file) => {
  if (!file) {
    throw new MockApiError('A document file is required', 400);
  }

  if (file.size > maxDocumentSize) {
    throw new MockApiError('Documents must be 10 MB or smaller', 400);
  }

  const expectedExtensions = allowedDocumentExtensionsByMimeType[file.type];
  if (!expectedExtensions) {
    throw new MockApiError('Only PDF, JPEG, PNG, DOCX, XLSX, and TXT files are allowed', 400);
  }
  if (!expectedExtensions.includes(getDocumentExtension(file.name))) {
    throw new MockApiError('File extension does not match the selected file type', 400);
  }
};

const ensureDocumentTypeIsAllowed = (documentType) => {
  if (!documentType) throw new MockApiError('Document type is required', 400);
  if (!allowedDocumentTypes.includes(documentType)) {
    throw new MockApiError('Invalid document type', 400);
  }
};

const findWorker = (workerID) => state.workers.find(worker => worker.workerID === Number(workerID));
const findCompany = (companyID) => state.companies.find(company => company.companyID === Number(companyID));
const findWorkOrder = (workOrderID) => state.workOrders.find(order => order.workOrderID === Number(workOrderID));
const findTeam = (teamID) => state.teams.find(team => team.teamID === Number(teamID));
const findProject = (projectID) => state.projects.find(project => project.projectID === Number(projectID));
const authenticatedWorker = () => {
  const workerID = typeof localStorage === 'undefined'
    ? null
    : Number(localStorage.getItem(AUTHENTICATED_WORKER_KEY));
  const worker = workerID ? findWorker(workerID) : null;
  return worker && !worker.archived ? worker : null;
};
const requireAuthenticatedWorker = () => {
  const worker = authenticatedWorker();
  if (!worker) throw new MockApiError('Authentication is required', 401);
  return worker;
};
const requireAdmin = (worker) => {
  if (!worker.admin) throw new MockApiError('Administrator access is required', 403);
};
const enforceRoleContract = (segments, method, worker) => {
  const [resource, id, action] = segments;
  if (['companies', 'teams', 'documents'].includes(resource)) requireAdmin(worker);
  if (resource === 'workers') {
    const ownProfile = (id === 'me' && method === 'GET') || (Number(id) === worker.workerID && (
      (method === 'GET' && segments.length === 2) ||
      (method === 'PUT' && action === 'profile')
    ));
    if (!ownProfile) requireAdmin(worker);
  }
  if (resource === 'workorders') {
    const adminAction = (segments.length === 1 && method === 'POST') ||
      ['start', 'assign', 'company', 'restore', 'permanent', 'approve', 'reject'].includes(action) ||
      (action === 'workers' && method === 'DELETE') ||
      (segments.length === 2 && method === 'DELETE') ||
      (id === 'count');
    if (adminAction) requireAdmin(worker);
  }
  if (resource === 'projects') {
    const sharedAction = ['submit', 'comments', 'action-items', 'documents'].includes(action);
    const readOnly = method === 'GET';
    if (!readOnly && !sharedAction) requireAdmin(worker);
    if (id === 'count') requireAdmin(worker);
  }
};
const workerCanAccessWorkOrder = (worker, order) => (
  worker.admin || (order.workers || []).some(item => item.workerID === worker.workerID)
);
const workerCanAccessProject = (worker, project) => (
  worker.admin ||
  (project.teams || []).some(team => (team.workers || []).some(item => item.workerID === worker.workerID)) ||
  (project.workOrders || []).some(order => workerCanAccessWorkOrder(worker, order))
);
const visibleWorkOrders = items => {
  const worker = requireAuthenticatedWorker();
  return items.filter(order => workerCanAccessWorkOrder(worker, order));
};
const visibleProjects = items => {
  const worker = requireAuthenticatedWorker();
  return items.filter(project => workerCanAccessProject(worker, project));
};
const projectReferenceForWorkOrder = (workOrderID) => {
  const project = state.projects.find(item =>
    (item.workOrders || []).some(order => order.workOrderID === Number(workOrderID))
  );

  return project ? {
    projectID: project.projectID,
    projectName: project.projectName,
    projectStatus: project.projectStatus,
  } : null;
};
const isOpenWorkOrder = (order) => order.status !== 'COMPLETE';
const syncWorkOrderIntoProjects = (workOrder) => {
  state.projects = state.projects.map(project => ({
    ...project,
    workOrders: (project.workOrders || []).map(item => (
      item.workOrderID === workOrder.workOrderID ? clone(workOrder) : item
    )),
  }));
};
const ensureWorkOrderCanBeEdited = (order) => {
  if (order.status === 'COMPLETE') {
    throw new MockApiError('Completed work orders are sealed and cannot be edited', 409);
  }
};

const touch = (item) => {
  item.lastModifiedAt = now();
  return item;
};

const archiveEntity = (item) => {
  item.archived = true;
  item.archivedAt = now();
  touch(item);
  return item;
};

const restoreEntity = (item) => {
  item.archived = false;
  item.archivedAt = null;
  touch(item);
  return item;
};

const createLoginResponse = (worker) => ({
  workerID: worker.workerID,
  workerUser: worker.workerUser,
  workerFName: worker.workerFName,
  workerLName: worker.workerLName,
  workerDisplayName: worker.workerDisplayName,
  workerEmail: worker.workerEmail,
  lastLoginAt: worker.lastLoginAt,
  admin: worker.admin,
});

const toDocumentResponse = (document) => ({
  documentID: document.documentID,
  workOrderID: document.workOrderID,
  workOrderStatus: document.workOrderStatus,
  projectID: document.projectID,
  projectName: document.projectName,
  projectStatus: document.projectStatus,
  companyName: document.companyName,
  fileName: document.fileName,
  documentType: document.documentType || 'OTHER',
  mimeType: document.mimeType,
  fileSize: document.fileSize,
  uploadedByWorkerID: document.uploadedByWorkerID,
  uploadedBy: document.uploadedBy,
  createdAt: document.createdAt,
  lastModifiedAt: document.lastModifiedAt,
});

const allDocuments = () => [
  ...state.workOrders.flatMap(order => (
    (order.documents || []).map(document => toDocumentResponse({
      ...document,
      workOrderID: order.workOrderID,
      workOrderStatus: order.status,
      companyName: order.company?.companyName || null,
    }))
  )),
  ...state.projects.flatMap(project => (
    (project.documents || []).map(document => toDocumentResponse({
      ...document,
      projectID: project.projectID,
      projectName: project.projectName,
      projectStatus: project.projectStatus,
    }))
  )),
].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const sumWorkOrderItems = (workOrders) => (workOrders || [])
  .flatMap(order => order.items || [])
  .reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);

const projectResponse = (project) => {
  const actualCost = sumWorkOrderItems(project.workOrders);
  const budget = Number(project.budget) || 0;

  return {
    ...project,
    estimatedCost: actualCost,
    actualCost,
    budgetDifference: budget - actualCost,
    teamCount: project.teams?.length || 0,
    workOrderCount: project.workOrders?.length || 0,
  };
};

const actionItemAssignee = (payload) => {
  if (payload.assignedWorker?.workerID && payload.assignedTeam?.teamID) {
    throw new MockApiError('Action items can be assigned to a worker or a team, but not both', 409);
  }

  const assignedWorker = payload.assignedWorker?.workerID ? findWorker(payload.assignedWorker.workerID) : null;
  const assignedTeam = payload.assignedTeam?.teamID ? findTeam(payload.assignedTeam.teamID) : null;

  if (payload.assignedWorker?.workerID && !assignedWorker) {
    throw new MockApiError('Assigned worker not found', 404);
  }

  if (payload.assignedTeam?.teamID && !assignedTeam) {
    throw new MockApiError('Assigned team not found', 404);
  }

  return {
    assignedWorker: assignedWorker ? withoutPassword(assignedWorker) : null,
    assignedTeam: assignedTeam ? clone(assignedTeam) : null,
  };
};

const handleAuth = (segments, method, options) => {
  if (segments[1] === 'login' && method === 'POST') {
    const { username = '', password = '' } = bodyAsJson(options);
    if (!username.trim() || !password) {
      throw new MockApiError('Username and password are required', 400);
    }
    const worker = state.workers.find(item => item.workerUser === username.trim() && !item.archived);

    if (!worker || worker.workerPW !== password) {
      throw new MockApiError('Invalid username or password', 401);
    }

    worker.lastLoginAt = now();
    touch(worker);
    saveState();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTHENTICATED_WORKER_KEY, String(worker.workerID));
    }

    return createLoginResponse(worker);
  }

  if (segments[1] === 'me' && method === 'GET') {
    const worker = authenticatedWorker();
    if (!worker) {
      throw new MockApiError('Authentication is required', 401);
    }
    return createLoginResponse(worker);
  }

  if (segments[1] === 'logout' && method === 'POST') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTHENTICATED_WORKER_KEY);
    }
    return null;
  }

  throw new MockApiError('Mock auth route not found', 404);
};

const handleWorkers = (segments, method, options) => {
  if (segments[1] === 'count' && method === 'GET') {
    return activeOnly(state.workers).length;
  }

  if (segments.length === 1 && method === 'GET') {
    return activeOnly(state.workers).map(withoutPassword);
  }

  if (segments[1] === 'all-with-archived' && method === 'GET') {
    return state.workers.map(withoutPassword);
  }

  if (segments[1] === 'archived' && method === 'GET') {
    return archivedOnly(state.workers).map(withoutPassword);
  }

  if (segments[1] === 'me' && method === 'GET') {
    return withoutPassword(requireAuthenticatedWorker());
  }

  if (segments.length === 1 && method === 'POST') {
    const payload = bodyAsJson(options);
    if (!payload.workerFName || !payload.workerLName || !payload.workerUser || !payload.workerEmail) {
      throw new MockApiError('Worker name, username, and email are required', 400);
    }
    if (state.workers.some(worker => worker.workerUser?.toLowerCase() === payload.workerUser.toLowerCase())) {
      throw new MockApiError('Username already exists', 409);
    }
    if (state.workers.some(worker => worker.workerEmail?.toLowerCase() === payload.workerEmail.toLowerCase())) {
      throw new MockApiError('Email already exists', 409);
    }
    const worker = {
      workerID: nextId(state.workers, 'workerID'),
      workerFName: payload.workerFName,
      workerLName: payload.workerLName,
      workerDisplayName: payload.workerDisplayName || '',
      workerUser: payload.workerUser,
      workerEmail: payload.workerEmail,
      workerPW: payload.workerPW,
      admin: Boolean(payload.admin),
      createdAt: now(),
      lastModifiedAt: now(),
      archived: false,
      archivedAt: null,
    };
    state.workers.push(worker);
    saveState();
    return withoutPassword(worker);
  }

  const workerID = segments[1];
  const worker = findWorker(workerID);
  if (!worker) throw new MockApiError('Worker not found', 404);

  if (segments.length === 2 && method === 'GET') {
    return withoutPassword(worker);
  }

  if (segments.length === 2 && method === 'DELETE') {
    const hasOpenWorkOrders = state.workOrders.some(order =>
      isOpenWorkOrder(order) && order.workers.some(item => item.workerID === worker.workerID)
    );

    if (hasOpenWorkOrders) {
      throw new MockApiError('Worker cannot be archived while assigned to open work orders', 409);
    }

    archiveEntity(worker);
    saveState();
    return null;
  }

  if (segments[2] === 'restore' && method === 'PUT') {
    restoreEntity(worker);
    saveState();
    return withoutPassword(worker);
  }

  if (segments[2] === 'permanent' && method === 'DELETE') {
    if (worker.archived) {
      throw new MockApiError('Archived workers can only be restored', 409);
    }

    const hasAttachedWorkOrders = state.workOrders.some(order =>
      order.workers.some(item => item.workerID === worker.workerID)
    );
    if (hasAttachedWorkOrders) {
      throw new MockApiError('Worker cannot be permanently deleted while work orders are attached', 409);
    }

    state.workers = state.workers.filter(item => item.workerID !== worker.workerID);
    saveState();
    return null;
  }

  if (segments.length === 2 && method === 'PUT') {
    const payload = bodyAsJson(options);
    if (payload.workerEmail && state.workers.some(item =>
      item.workerID !== worker.workerID && item.workerEmail?.toLowerCase() === payload.workerEmail.toLowerCase()
    )) {
      throw new MockApiError('Email already exists', 409);
    }
    Object.assign(worker, {
      workerFName: payload.workerFName ?? worker.workerFName,
      workerLName: payload.workerLName ?? worker.workerLName,
      workerDisplayName: payload.workerDisplayName ?? worker.workerDisplayName,
      workerUser: payload.workerUser ?? worker.workerUser,
      workerEmail: payload.workerEmail ?? worker.workerEmail,
      admin: payload.admin ?? worker.admin,
    });
    touch(worker);
    state.workOrders = state.workOrders.map(order => ({
      ...order,
      workers: order.workers.map(item => (
        item.workerID === worker.workerID ? withoutPassword(worker) : item
      )),
    }));
    saveState();
    return withoutPassword(worker);
  }

  if (segments[2] === 'profile' && method === 'PUT') {
    const payload = bodyAsJson(options);
    if (payload.workerEmail && state.workers.some(item =>
      item.workerID !== worker.workerID && item.workerEmail?.toLowerCase() === payload.workerEmail.toLowerCase()
    )) {
      throw new MockApiError('Email already exists', 409);
    }
    Object.assign(worker, {
      workerFName: payload.workerFName ?? worker.workerFName,
      workerLName: payload.workerLName ?? worker.workerLName,
      workerDisplayName: payload.workerDisplayName ?? worker.workerDisplayName,
      workerEmail: payload.workerEmail ?? worker.workerEmail,
    });
    touch(worker);
    state.workOrders = state.workOrders.map(order => ({
      ...order,
      workers: order.workers.map(item => (
        item.workerID === worker.workerID ? withoutPassword(worker) : item
      )),
    }));
    saveState();
    return withoutPassword(worker);
  }

  if (segments[2] === 'password' && method === 'PUT') {
    const { newPassword } = bodyAsJson(options);
    worker.workerPW = newPassword;
    touch(worker);
    saveState();
    return null;
  }

  throw new MockApiError('Mock worker route not found', 404);
};

const handleCompanies = (segments, method, options) => {
  if (segments[1] === 'count' && method === 'GET') {
    return activeOnly(state.companies).length;
  }

  if ((segments.length === 1 || segments[1] === 'all') && method === 'GET') {
    return activeOnly(state.companies);
  }

  if (segments[1] === 'all-with-archived' && method === 'GET') {
    return state.companies;
  }

  if (segments[1] === 'archived' && method === 'GET') {
    return archivedOnly(state.companies);
  }

  if (segments[1] === 'add' && method === 'POST') {
    const payload = bodyAsJson(options);
    const company = {
      ...payload,
      companyID: nextId(state.companies, 'companyID'),
      createdAt: now(),
      lastModifiedAt: now(),
      archived: false,
      archivedAt: null,
    };
    state.companies.push(company);
    saveState();
    return company;
  }

  const companyID = segments[1];
  const company = findCompany(companyID);
  if (!company) throw new MockApiError('Company not found', 404);

  if (segments.length === 2 && method === 'PUT') {
    const payload = bodyAsJson(options);
    Object.assign(company, payload, { companyID: Number(companyID) });
    touch(company);
    state.workOrders = state.workOrders.map(order => (
      order.company?.companyID === Number(companyID) ? { ...order, company: clone(company) } : order
    ));
    saveState();
    return company;
  }

  if (segments.length === 2 && method === 'DELETE') {
    const hasOpenWorkOrders = state.workOrders.some(order =>
      isOpenWorkOrder(order) && order.company?.companyID === company.companyID
    );

    if (hasOpenWorkOrders) {
      throw new MockApiError('Company cannot be archived while associated with open work orders', 409);
    }

    archiveEntity(company);
    saveState();
    return null;
  }

  if (segments[2] === 'restore' && method === 'PUT') {
    restoreEntity(company);
    saveState();
    return company;
  }

  if (segments[2] === 'permanent' && method === 'DELETE') {
    if (company.archived) {
      throw new MockApiError('Archived companies can only be restored', 409);
    }

    const hasAttachedWorkOrders = state.workOrders.some(order => order.company?.companyID === company.companyID);
    if (hasAttachedWorkOrders) {
      throw new MockApiError('Company cannot be permanently deleted while work orders are attached', 409);
    }

    state.companies = state.companies.filter(item => item.companyID !== company.companyID);
    saveState();
    return null;
  }

  throw new MockApiError('Mock company route not found', 404);
};

const setWorkOrderStatus = (workOrder, status) => {
  workOrder.status = status;
  touch(workOrder);
  if (status === 'COMPLETE') {
    workOrder.endDateTime = new Date().toISOString();
  }
  if (status !== 'COMPLETE') {
    workOrder.endDateTime = null;
  }
  syncWorkOrderIntoProjects(workOrder);
  saveState();
  return workOrder;
};

const handleWorkOrderDocuments = (workOrder, segments, method, options) => {
  workOrder.documents = workOrder.documents || [];

  if (segments.length === 3 && method === 'GET') {
    return [...workOrder.documents]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(toDocumentResponse);
  }

  if (segments.length === 3 && method === 'POST') {
    ensureWorkOrderCanBeEdited(workOrder);

    const file = options.body instanceof FormData ? options.body.get('file') : null;
    const documentType = options.body instanceof FormData ? options.body.get('documentType') : null;
    ensureDocumentFileIsAllowed(file);
    ensureDocumentTypeIsAllowed(documentType);

    const uploader = workOrder.workers?.[0] || state.workers.find(worker => worker.admin) || state.workers[0];
    const uploadedBy = uploader
      ? `${uploader.workerFName || ''} ${uploader.workerLName || ''}`.trim() || uploader.workerUser
      : 'Mock User';
    const document = {
      documentID: nextId(workOrder.documents, 'documentID'),
      workOrderID: workOrder.workOrderID,
      workOrderStatus: workOrder.status,
      companyName: workOrder.company?.companyName || null,
      fileName: file.name,
      documentType,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      uploadedByWorkerID: uploader?.workerID || 0,
      uploadedBy,
      createdAt: now(),
      lastModifiedAt: now(),
    };

    workOrder.documents = [document, ...workOrder.documents];
    touch(workOrder);
    saveState();
    return toDocumentResponse(document);
  }

  const documentID = Number(segments[3]);
  const document = workOrder.documents.find(item => item.documentID === documentID);
  if (!document) throw new MockApiError('Document not found', 404);

  if (segments.length === 4 && method === 'DELETE') {
    ensureWorkOrderCanBeEdited(workOrder);

    workOrder.documents = workOrder.documents.filter(item => item.documentID !== documentID);
    touch(workOrder);
    saveState();
    return null;
  }

  throw new MockApiError('Mock work order document route not found', 404);
};

const handleProjectDocuments = (project, segments, method, options) => {
  if (method !== 'GET' && (project.archived || project.projectStatus !== 'OPEN')) {
    throw new MockApiError('Project documents can only be changed while the project is open', 409);
  }

  project.documents = project.documents || [];

  if (segments.length === 3 && method === 'GET') {
    return [...project.documents]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(document => toDocumentResponse({
        ...document,
        projectID: project.projectID,
        projectName: project.projectName,
        projectStatus: project.projectStatus,
      }));
  }

  if (segments.length === 3 && method === 'POST') {
    const file = options.body instanceof FormData ? options.body.get('file') : null;
    const documentType = options.body instanceof FormData ? options.body.get('documentType') : null;
    ensureDocumentFileIsAllowed(file);
    ensureDocumentTypeIsAllowed(documentType);

    const uploader = project.teams?.flatMap(team => team.workers || [])?.[0]
      || state.workers.find(worker => worker.admin)
      || state.workers[0];
    const uploadedBy = uploader
      ? `${uploader.workerFName || ''} ${uploader.workerLName || ''}`.trim() || uploader.workerUser
      : 'Mock User';
    const document = {
      documentID: nextId(allDocuments(), 'documentID'),
      projectID: project.projectID,
      projectName: project.projectName,
      projectStatus: project.projectStatus,
      fileName: file.name,
      documentType,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      uploadedByWorkerID: uploader?.workerID || 0,
      uploadedBy,
      createdAt: now(),
      lastModifiedAt: now(),
    };

    project.documents = [document, ...project.documents];
    touch(project);
    saveState();
    return toDocumentResponse(document);
  }

  const documentID = Number(segments[3]);
  const document = project.documents.find(item => item.documentID === documentID);
  if (!document) throw new MockApiError('Document not found', 404);

  if (segments.length === 4 && method === 'DELETE') {
    project.documents = project.documents.filter(item => item.documentID !== documentID);
    touch(project);
    saveState();
    return null;
  }

  throw new MockApiError('Mock project document route not found', 404);
};

const handleWorkOrders = (segments, method, options) => {
  if (segments.length === 1 && method === 'GET') {
    return visibleWorkOrders(activeOnly(state.workOrders))
      .map(order => ({
        ...order,
        project: order.project || projectReferenceForWorkOrder(order.workOrderID),
        fileNo: order.documents?.length || 0,
      }));
  }

  if (segments[1] === 'all-with-archived' && method === 'GET') {
    return visibleWorkOrders(state.workOrders).map(order => ({
      ...order,
      project: order.project || projectReferenceForWorkOrder(order.workOrderID),
      fileNo: order.documents?.length || 0,
    }));
  }

  if (segments[1] === 'archived' && method === 'GET') {
    return visibleWorkOrders(archivedOnly(state.workOrders)).map(order => ({
      ...order,
      project: order.project || projectReferenceForWorkOrder(order.workOrderID),
      fileNo: order.documents?.length || 0,
    }));
  }

  if (segments[1] === 'count' && method === 'GET') {
    return activeOnly(state.workOrders).length;
  }

  if (segments.length === 1 && method === 'POST') {
    const payload = bodyAsJson(options);
    const workerRefs = Array.isArray(payload.workerIDs) ? payload.workerIDs : [];
    const company = payload.companyID ? findCompany(payload.companyID) : null;
    if (company?.archived) {
      throw new MockApiError('Archived companies cannot be assigned', 409);
    }
    const assignedWorkers = workerRefs
      .map(findWorker)
      .filter(worker => worker && !worker.archived)
      .map(withoutPassword);
    const workOrder = {
      workOrderID: nextId(state.workOrders, 'workOrderID'),
      workers: assignedWorkers,
      company: company ? clone(company) : null,
      status: assignedWorkers.length ? 'IN_PROCESS' : 'OPEN',
      startDateTime: payload.startDateTime || new Date().toISOString(),
      endDateTime: payload.endDateTime || null,
      comment: payload.comment || '',
      items: [],
      documents: [],
      createdAt: now(),
      lastModifiedAt: now(),
      archived: false,
      archivedAt: null,
    };
    state.workOrders.push(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[1] === 'company' && method === 'GET') {
    const companyID = Number(segments[2]);
    return activeOnly(state.workOrders)
      .filter(order => order.company?.companyID === companyID)
      .map(order => ({
        ...order,
        project: order.project || projectReferenceForWorkOrder(order.workOrderID),
        fileNo: order.documents?.length || 0,
      }));
  }

  const workOrderID = segments[1];
  const workOrder = findWorkOrder(workOrderID);
  if (!workOrder) throw new MockApiError('Work order not found', 404);
  if (!workerCanAccessWorkOrder(requireAuthenticatedWorker(), workOrder)) {
    throw new MockApiError('Worker is not assigned to this work order', 403);
  }

  if (segments.length === 2 && method === 'GET') {
    return {
      ...workOrder,
      project: workOrder.project || projectReferenceForWorkOrder(workOrder.workOrderID),
      fileNo: workOrder.documents?.length || 0,
    };
  }

  if (segments[2] === 'documents') {
    return handleWorkOrderDocuments(workOrder, segments, method, options);
  }

  if (segments.length === 2 && method === 'DELETE') {
    if (workOrder.status !== 'COMPLETE') {
      throw new MockApiError('Only completed work orders can be archived', 409);
    }

    archiveEntity(workOrder);
    saveState();
    return null;
  }

  if (segments[2] === 'restore' && method === 'PUT') {
    restoreEntity(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[2] === 'permanent' && method === 'DELETE') {
    const hasItems = Boolean(workOrder.items?.length);
    const canDeleteMistakenWorkOrder = workOrder.status === 'OPEN' && !workOrder.endDateTime && !hasItems;

    if (workOrder.archived || !canDeleteMistakenWorkOrder || workOrder.documents?.length || workOrder.workers?.length || workOrder.company || workOrder.project || workOrder.comment) {
      throw new MockApiError('Only empty open work orders without business history can be permanently deleted', 409);
    }

    state.workOrders = state.workOrders.filter(item => item.workOrderID !== workOrder.workOrderID);
    saveState();
    return null;
  }

  if (segments[2] === 'workers' && segments[3] && method === 'DELETE') {
    ensureWorkOrderCanBeEdited(workOrder);

    const workerID = Number(segments[3]);
    workOrder.workers = workOrder.workers.filter(worker => worker.workerID !== workerID);
    if (!workOrder.workers.length) {
      workOrder.status = 'OPEN';
      workOrder.endDateTime = null;
    }
    touch(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[2] === 'company' && method === 'DELETE') {
    ensureWorkOrderCanBeEdited(workOrder);

    workOrder.company = null;
    touch(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[2] === 'company' && method === 'PUT') {
    ensureWorkOrderCanBeEdited(workOrder);

    const { companyID } = bodyAsJson(options);
    const company = findCompany(companyID);
    if (!company) {
      throw new MockApiError('Company not found', 404);
    }
    if (company.archived) {
      throw new MockApiError('Archived companies cannot be assigned', 409);
    }

    workOrder.company = clone(company);
    touch(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[2] === 'comment' && method === 'PUT') {
    ensureWorkOrderCanBeEdited(workOrder);

    const { comment = '' } = bodyAsJson(options);
    workOrder.comment = comment;
    touch(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[2] === 'items' && method === 'POST') {
    ensureWorkOrderCanBeEdited(workOrder);

    const payload = bodyAsJson(options);
    const item = {
      workOrderItemID: nextId(workOrder.items || [], 'workOrderItemID'),
      itemName: payload.itemName || '',
      quantity: Number(payload.quantity) || 0,
      price: Number(payload.price) || 0,
      itemType: payload.itemType || 'OTHER',
      createdAt: now(),
      lastModifiedAt: now(),
    };
    workOrder.items = [...(workOrder.items || []), item];
    touch(workOrder);
    syncWorkOrderIntoProjects(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[2] === 'items' && segments[3] && method === 'PUT') {
    ensureWorkOrderCanBeEdited(workOrder);

    const itemID = Number(segments[3]);
    const payload = bodyAsJson(options);
    workOrder.items = (workOrder.items || []).map(item => (
      item.workOrderItemID === itemID
        ? {
            ...item,
            itemType: payload.itemType || item.itemType || 'OTHER',
            itemName: payload.itemName || '',
            quantity: Number(payload.quantity) || 0,
            price: Number(payload.price) || 0,
          }
        : item
    ));
    touch(workOrder);
    syncWorkOrderIntoProjects(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[2] === 'items' && segments[3] && method === 'DELETE') {
    ensureWorkOrderCanBeEdited(workOrder);

    const itemID = Number(segments[3]);
    workOrder.items = (workOrder.items || []).filter(item => item.workOrderItemID !== itemID);
    touch(workOrder);
    syncWorkOrderIntoProjects(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[2] === 'start' && method === 'PUT') {
    ensureWorkOrderCanBeEdited(workOrder);
    if (workOrder.status !== 'OPEN') {
      throw new MockApiError('Only open work orders can be started', 409);
    }

    workOrder.startDateTime = new Date().toISOString();
    return setWorkOrderStatus(workOrder, 'IN_PROCESS');
  }

  if (segments[2] === 'assign' && method === 'PUT') {
    ensureWorkOrderCanBeEdited(workOrder);

    const { workerID } = bodyAsJson(options);
    const worker = findWorker(workerID);
    if (!worker) {
      throw new MockApiError('Worker not found', 404);
    }
    if (worker.archived) {
      throw new MockApiError('Archived workers cannot be assigned', 409);
    }

    if (!workOrder.workers.some(item => item.workerID === worker.workerID)) {
      workOrder.workers = [...workOrder.workers, withoutPassword(worker)];
    }
    workOrder.status = 'IN_PROCESS';
    workOrder.endDateTime = null;
    touch(workOrder);
    saveState();
    return workOrder;
  }

  if (segments[2] === 'submit' && method === 'PUT') {
    ensureWorkOrderCanBeEdited(workOrder);

    return setWorkOrderStatus(workOrder, 'IN_REVIEW');
  }

  if (segments[2] === 'approve' && method === 'PUT') {
    if (workOrder.status !== 'IN_REVIEW') {
      throw new MockApiError('Only work orders under review can be approved', 409);
    }
    if (!workOrder.workers?.length) throw new MockApiError('At least one worker must be assigned', 409);
    if (!workOrder.company?.companyID) throw new MockApiError('A valid company must be assigned', 409);
    if (!workOrder.startDateTime) throw new MockApiError('Start date and time are required', 409);
    if (!workOrder.endDateTime) throw new MockApiError('End date and time are required', 409);
    if (!workOrder.items?.length) throw new MockApiError('At least one item is required', 409);
    return setWorkOrderStatus(workOrder, 'COMPLETE');
  }

  if (segments[2] === 'reject' && method === 'PUT') {
    if (workOrder.status !== 'IN_REVIEW') {
      throw new MockApiError('Only work orders under review can be rejected', 409);
    }
    return setWorkOrderStatus(workOrder, 'IN_PROCESS');
  }

  throw new MockApiError('Mock work order route not found', 404);
};

const handleTeams = (segments, method, options) => {
  if (segments[1] === 'count' && method === 'GET') {
    return state.teams.length;
  }

  if (segments.length === 1 && method === 'GET') {
    return state.teams;
  }

  if (segments[1] === 'project' && method === 'GET') {
    const project = findProject(segments[2]);
    if (!project) throw new MockApiError('Project not found', 404);
    return project.teams || [];
  }

  if (segments.length === 1 && method === 'POST') {
    const payload = bodyAsJson(options);
    const workers = (payload.workerIDs || []).map(findWorker).filter(Boolean).map(withoutPassword);
    if (!workers.length) {
      throw new MockApiError('A team must have at least one worker', 409);
    }

    const team = {
      teamID: nextId(state.teams, 'teamID'),
      teamName: payload.teamName || '',
      projectStartedAt: payload.projectStartedAt || null,
      workers,
    };
    state.teams.push(team);
    saveState();
    return team;
  }

  const team = findTeam(segments[1]);
  if (!team) throw new MockApiError('Team not found', 404);

  if (segments.length === 2 && method === 'GET') {
    return team;
  }

  if (segments.length === 2 && method === 'PUT') {
    const payload = bodyAsJson(options);
    const workers = (payload.workerIDs || []).map(findWorker).filter(Boolean).map(withoutPassword);
    if (!workers.length) {
      throw new MockApiError('A team must have at least one worker', 409);
    }
    const previousTeam = clone(team);

    Object.assign(team, {
      teamName: payload.teamName || '',
      projectStartedAt: payload.projectStartedAt || team.projectStartedAt || null,
      workers,
    });

    state.projects = state.projects.map(project => ({
      ...project,
      teams: (project.teams || []).map(item => item.teamID === team.teamID ? clone(team) : item),
    }));
    state.projects = state.projects.map(project => (
      (project.teams || []).some(item => item.teamID === team.teamID)
        ? syncActiveProjectTeamWorkers(project, [previousTeam], project.teams || [])
        : project
    ));
    state.projects.forEach(syncProjectWorkOrdersIntoState);
    saveState();
    return team;
  }

  if (segments.length === 2 && method === 'DELETE') {
    state.teams = state.teams.filter(item => item.teamID !== team.teamID);
    state.projects = state.projects.map(project => ({
      ...project,
      teams: (project.teams || []).filter(item => item.teamID !== team.teamID),
    }));
    state.projects = state.projects.map(project => syncActiveProjectTeamWorkers(
      project,
      [team],
      project.teams || [],
    ));
    state.projects.forEach(syncProjectWorkOrdersIntoState);
    saveState();
    return null;
  }

  throw new MockApiError('Mock team route not found', 404);
};

const teamWorkers = (teams) => {
  const workersByID = new Map();
  (teams || []).forEach(team => {
    (team.workers || []).forEach(worker => workersByID.set(worker.workerID, worker));
  });
  return workersByID;
};

const syncActiveProjectTeamWorkers = (project, previousTeams, currentTeams) => {
  if (project.projectStatus !== 'OPEN') return project;

  const previousWorkers = teamWorkers(previousTeams);
  const currentWorkers = teamWorkers(currentTeams);
  const removedWorkerIDs = [...previousWorkers.keys()].filter(workerID => !currentWorkers.has(workerID));
  const addedWorkers = [...currentWorkers.values()].filter(worker => !previousWorkers.has(worker.workerID));

  return {
    ...project,
    workOrders: (project.workOrders || []).map(order => {
      if (!['OPEN', 'IN_PROCESS'].includes(order.status)) return order;

      const existingWorkers = new Map((order.workers || [])
        .filter(worker => !removedWorkerIDs.includes(worker.workerID))
        .map(worker => [worker.workerID, worker]));
      addedWorkers.forEach(worker => existingWorkers.set(worker.workerID, worker));
      const workers = [...existingWorkers.values()];

      return {
        ...order,
        workers,
        status: workers.length ? 'IN_PROCESS' : 'OPEN',
      };
    }),
  };
};

const syncProjectWorkOrdersIntoState = (project) => {
  state.workOrders = state.workOrders.map(order => {
    const projectOrder = (project.workOrders || []).find(item => item.workOrderID === order.workOrderID);
    return projectOrder ? clone(projectOrder) : order;
  });
};

const teamIsEmpty = (team) => !(team?.workers || []).length;

const ensureProjectTeamsAreNotEmpty = (teams = []) => {
  if ((teams || []).some(teamIsEmpty)) {
    throw new MockApiError('Associated team is empty', 409);
  }
};

const handleProjects = (segments, method, options) => {
  if (segments.length === 1 && method === 'GET') {
    return visibleProjects(activeOnly(state.projects)).map(projectResponse);
  }

  if (segments[1] === 'all-with-archived' && method === 'GET') {
    return visibleProjects(state.projects).map(projectResponse);
  }

  if (segments[1] === 'archived' && method === 'GET') {
    return visibleProjects(archivedOnly(state.projects)).map(projectResponse);
  }

  if (segments[1] === 'count' && method === 'GET') {
    return activeOnly(state.projects).length;
  }

  if (segments.length === 1 && method === 'POST') {
    const payload = bodyAsJson(options);
    const projectTeams = (payload.teamIDs || []).map(findTeam).filter(Boolean).map(clone);
    const project = withAuditDefaults({
      projectID: nextId(state.projects, 'projectID'),
      projectName: payload.projectName || '',
      description: payload.description || '',
      budget: payload.budget ?? null,
      estimatedCost: payload.estimatedCost ?? null,
      actualCost: payload.actualCost ?? null,
      projectStatus: 'OPEN',
      activatedAt: null,
      completedAt: null,
      archived: false,
      archivedAt: null,
      teams: projectTeams,
      workOrders: [],
      comments: [],
      actionItems: [],
      documents: [],
      snapshots: [],
    });
    state.projects.push(project);
    saveState();
    return projectResponse(project);
  }

  const project = findProject(segments[1]);
  if (!project) throw new MockApiError('Project not found', 404);
  if (!workerCanAccessProject(requireAuthenticatedWorker(), project)) {
    throw new MockApiError('Worker is not assigned to this project', 403);
  }

  if (segments.length === 2 && method === 'GET') {
    return projectResponse(project);
  }

  if (segments[2] === 'documents') {
    return handleProjectDocuments(project, segments, method, options);
  }

  if (segments[2] === 'restore' && method === 'PUT') {
    restoreEntity(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'permanent' && method === 'DELETE') {
    const hasHistory = ['workOrders', 'comments', 'actionItems', 'snapshots', 'documents']
      .some(key => (project[key] || []).length);
    if (project.archived || project.projectStatus !== 'OPEN' || hasHistory) {
      throw new MockApiError('Only empty open projects without business history can be permanently deleted', 409);
    }
    state.projects = state.projects.filter(item => item.projectID !== project.projectID);
    saveState();
    return null;
  }

  if (segments.length === 2 && method === 'PUT') {
    const payload = bodyAsJson(options);
    Object.assign(project, {
      projectName: payload.projectName ?? project.projectName,
      description: payload.description ?? project.description,
      budget: payload.budget ?? project.budget ?? null,
      estimatedCost: payload.estimatedCost ?? project.estimatedCost ?? null,
      actualCost: payload.actualCost ?? project.actualCost ?? null,
    });
    if (Array.isArray(payload.teamIDs)) {
      const previousTeams = project.teams || [];
      const nextTeams = payload.teamIDs.map(findTeam).filter(Boolean).map(clone);
      ensureProjectTeamsAreNotEmpty(nextTeams);
      project.teams = nextTeams;
      Object.assign(project, syncActiveProjectTeamWorkers(project, previousTeams, nextTeams));
      syncProjectWorkOrdersIntoState(project);
    }
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments.length === 2 && method === 'DELETE') {
    if (project.projectStatus !== 'OPEN') {
      const hasOpenWorkOrder = (project.workOrders || []).some(order => order.status !== 'COMPLETE');
      if (hasOpenWorkOrder) {
        throw new MockApiError('Projects can only be archived when all work orders are complete', 409);
      }
      ensureProjectTeamsAreNotEmpty(project.teams || []);
    }
    archiveEntity(project);
    saveState();
    return null;
  }

  if (segments[2] === 'submit' && method === 'PUT') {
    if (project.projectStatus !== 'OPEN') {
      throw new MockApiError('Only open projects can be submitted for review', 409);
    }
    if (!(project.workOrders || []).every(order => order.status === 'COMPLETE')) {
      throw new MockApiError('Projects can only be submitted when all work orders are complete', 409);
    }
    ensureProjectTeamsAreNotEmpty(project.teams || []);
    project.projectStatus = 'IN_REVIEW';
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'complete' && method === 'PUT') {
    if (project.projectStatus !== 'IN_REVIEW') {
      throw new MockApiError('Only projects under review can be completed', 409);
    }
    if (!(project.workOrders || []).every(order => order.status === 'COMPLETE')) {
      throw new MockApiError('Projects can only be completed when all work orders are complete', 409);
    }
    ensureProjectTeamsAreNotEmpty(project.teams || []);
    project.projectStatus = 'COMPLETE';
    project.completedAt = now();
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'reject' && method === 'PUT') {
    if (project.projectStatus !== 'IN_REVIEW') {
      throw new MockApiError('Only projects under review can be rejected', 409);
    }
    project.projectStatus = 'OPEN';
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'workorders' && method === 'PUT') {
    const { workOrderID } = bodyAsJson(options);
    const workOrder = findWorkOrder(workOrderID);
    if (!workOrder) throw new MockApiError('Work order not found', 404);
    if (project.projectStatus !== 'OPEN') throw new MockApiError('Existing work orders can only be attached to active projects', 409);
    if (workOrder.project && workOrder.project.projectID !== project.projectID) {
      throw new MockApiError('Work order is already associated with another project', 409);
    }
    if (!['OPEN', 'IN_PROCESS'].includes(workOrder.status)) {
      throw new MockApiError('Only open or active work orders can be attached to active projects', 409);
    }
    workOrder.project = {
      projectID: project.projectID,
      projectName: project.projectName,
      projectStatus: project.projectStatus,
    };
    if (!(project.workOrders || []).some(order => order.workOrderID === workOrder.workOrderID)) {
      project.workOrders = [...(project.workOrders || []), clone(workOrder)];
    }
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'workorders' && method === 'POST') {
    if (project.archived || project.projectStatus !== 'OPEN') {
      throw new MockApiError('Active project work orders can only be created for active projects', 409);
    }

    const payload = bodyAsJson(options);
    const team = payload.teamID ? findTeam(payload.teamID) : null;
    if (payload.teamID && !team) throw new MockApiError('Team not found', 404);
    if (team) ensureProjectTeamsAreNotEmpty([team]);
    const company = payload.companyID ? findCompany(payload.companyID) : null;
    if (payload.companyID && !company) throw new MockApiError('Company not found', 404);
    if (company?.archived) throw new MockApiError('Archived companies cannot be assigned', 409);

    if (team && !(project.teams || []).some(item => item.teamID === team.teamID)) {
      const previousTeams = project.teams || [];
      project.teams = [...(project.teams || []), clone(team)];
      Object.assign(project, syncActiveProjectTeamWorkers(project, previousTeams, project.teams));
      syncProjectWorkOrdersIntoState(project);
    }

    const workers = team ? (team.workers || []).map(withoutPassword) : [];
    const workOrder = {
      workOrderID: nextId(state.workOrders, 'workOrderID'),
      workers,
      company: company ? clone(company) : null,
      project: {
        projectID: project.projectID,
        projectName: project.projectName,
        projectStatus: project.projectStatus,
      },
      status: workers.length ? 'IN_PROCESS' : 'OPEN',
      startDateTime: now(),
      endDateTime: null,
      comment: payload.comment || '',
      items: [],
      documents: [],
      createdAt: now(),
      lastModifiedAt: now(),
      archived: false,
      archivedAt: null,
    };

    state.workOrders.push(workOrder);
    project.workOrders = [...(project.workOrders || []), clone(workOrder)];
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'workorders' && segments[3] && method === 'DELETE') {
    const workOrder = findWorkOrder(segments[3]);
    if (workOrder?.project?.projectID === project.projectID) {
      workOrder.previousProjectID = project.projectID;
      workOrder.previousProjectName = project.projectName;
      workOrder.project = null;
    }
    project.workOrders = (project.workOrders || []).filter(order => order.workOrderID !== Number(segments[3]));
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'snapshots' && segments[3] && method === 'DELETE') {
    project.snapshots = (project.snapshots || []).filter(snapshot => snapshot.projectSnapshotID !== Number(segments[3]));
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'comments' && method === 'POST') {
    if (project.archived || project.projectStatus === 'COMPLETE') {
      throw new MockApiError('Completed or archived projects cannot receive comments', 409);
    }
    const payload = bodyAsJson(options);
    if (!payload.commentText?.trim()) {
      throw new MockApiError('Comment text is required', 400);
    }
    if (!payload.commentType) {
      throw new MockApiError('Comment type is required', 400);
    }
    const comment = {
      projectCommentID: nextId(project.comments || [], 'projectCommentID'),
      commentText: payload.commentText,
      commentType: payload.commentType,
      author: payload.author || null,
      createdAt: now(),
    };
    project.comments = [...(project.comments || []), comment];
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'action-items' && segments.length === 3 && method === 'POST') {
    if (project.archived || project.projectStatus === 'COMPLETE') {
      throw new MockApiError('Action items cannot be edited on completed or archived projects', 409);
    }
    const payload = bodyAsJson(options);
    if (!payload.itemText?.trim()) {
      throw new MockApiError('Action item text is required', 400);
    }
    const assignee = actionItemAssignee(payload);
    const actionItem = {
      actionItemID: nextId(project.actionItems || [], 'actionItemID'),
      itemText: payload.itemText,
      completed: false,
      completedAt: null,
      dueDate: payload.dueDate || null,
      assignedWorker: assignee.assignedWorker,
      assignedTeam: assignee.assignedTeam,
    };
    project.actionItems = [...(project.actionItems || []), actionItem];
    touch(project);
    saveState();
    return projectResponse(project);
  }

  if (segments[2] === 'action-items' && segments[3]) {
    const actionItemID = Number(segments[3]);
    const actionItem = (project.actionItems || []).find(item => item.actionItemID === actionItemID);
    if (!actionItem) throw new MockApiError('Action item not found', 404);

    if (segments.length === 4 && method === 'PUT') {
      if (project.archived || project.projectStatus === 'COMPLETE') {
        throw new MockApiError('Action items cannot be edited on completed or archived projects', 409);
      }
      const payload = bodyAsJson(options);
      const assignee = actionItemAssignee(payload);
      actionItem.itemText = payload.itemText || actionItem.itemText;
      actionItem.dueDate = payload.dueDate ?? actionItem.dueDate ?? null;
      actionItem.assignedWorker = assignee.assignedWorker;
      actionItem.assignedTeam = assignee.assignedTeam;
      touch(project);
      saveState();
      return projectResponse(project);
    }

    if (segments.length === 4 && method === 'DELETE') {
      if (project.archived || project.projectStatus === 'COMPLETE') {
        throw new MockApiError('Action items cannot be edited on completed or archived projects', 409);
      }
      project.actionItems = (project.actionItems || []).filter(item => item.actionItemID !== actionItemID);
      touch(project);
      saveState();
      return projectResponse(project);
    }

    if (segments[4] === 'complete' && method === 'PUT') {
      if (project.archived || project.projectStatus === 'COMPLETE') {
        throw new MockApiError('Action items cannot be completed on completed or archived projects', 409);
      }
      const { completed } = bodyAsJson(options);
      actionItem.completed = Boolean(completed);
      actionItem.completedAt = actionItem.completed ? now() : null;
      touch(project);
      saveState();
      return projectResponse(project);
    }
  }

  throw new MockApiError('Mock project route not found', 404);
};

export const resetMockApiState = () => {
  state = hydrateState({
    workers: clone(mockWorkers),
    companies: clone(mockCompanies),
    teams: clone(mockTeams),
    projects: clone(mockProjects),
    workOrders: clone(mockWorkOrders),
  });
  saveState();
};

export const mockApiFetch = async (path, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const segments = normalizeMockPath(path);

  try {
    if (segments[0] === 'workers' && segments[1] === 'login') {
      return toMockResponse(handleAuth(['auth', 'login'], method, options));
    }
    if (segments[0] === 'workers' && segments[1] === 'logout') {
      return toMockResponse(handleAuth(['auth', 'logout'], method, options));
    }
    if (segments[0] === 'auth') return toMockResponse(handleAuth(segments, method, options));
    const worker = requireAuthenticatedWorker();
    enforceRoleContract(segments, method, worker);
    if (segments[0] === 'workers') return toMockResponse(handleWorkers(segments, method, options));
    if (segments[0] === 'companies') return toMockResponse(handleCompanies(segments, method, options));
    if (segments[0] === 'documents' && method === 'GET') return toMockResponse(allDocuments());
    if (segments[0] === 'teams') return toMockResponse(handleTeams(segments, method, options));
    if (segments[0] === 'projects') return toMockResponse(handleProjects(segments, method, options));
    if (segments[0] === 'workorders') return toMockResponse(handleWorkOrders(segments, method, options));
  } catch (error) {
    throw error;
  }

  throw new MockApiError(`Mock route not found: ${method} ${path}`, 404);
};

export const mockApiDownload = async (path) => {
  const segments = normalizeMockPath(path);
  if (
    !['workorders', 'projects'].includes(segments[0]) ||
    segments[2] !== 'documents' ||
    segments[4] !== 'download'
  ) {
    throw new MockApiError(`Mock download route not found: ${path}`, 404);
  }

  const owner = segments[0] === 'workorders' ? findWorkOrder(segments[1]) : findProject(segments[1]);
  if (!owner) throw new MockApiError(`${segments[0] === 'workorders' ? 'Work order' : 'Project'} not found`, 404);

  const document = (owner.documents || []).find(item => item.documentID === Number(segments[3]));
  if (!document) throw new MockApiError('Document not found', 404);

  return new Blob(
    [`Mock download for ${document.fileName}\n\nThis file was uploaded in mock mode.`],
    { type: document.mimeType || 'text/plain' }
  );
};
