import { mockCompanies, mockWorkers, mockWorkOrders } from './mockData';

const STORAGE_KEY = 'atelicoveMockApiStateV2';

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
  workOrders: (rawState.workOrders || []).map(order => ({
    ...withAuditDefaults(order),
    workers: (order.workers || []).map(withWorkerDefaults),
    company: order.company ? withAuditDefaults(order.company) : null,
    items: (order.items || []).map(withAuditDefaults),
  })),
});

const loadState = () => {
  if (typeof localStorage === 'undefined') {
    return hydrateState({
      workers: clone(mockWorkers),
      companies: clone(mockCompanies),
      workOrders: clone(mockWorkOrders),
    });
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return hydrateState(JSON.parse(saved));
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const initialState = hydrateState({
    workers: clone(mockWorkers),
    companies: clone(mockCompanies),
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

const findWorker = (workerID) => state.workers.find(worker => worker.workerID === Number(workerID));
const findCompany = (companyID) => state.companies.find(company => company.companyID === Number(companyID));
const findWorkOrder = (workOrderID) => state.workOrders.find(order => order.workOrderID === Number(workOrderID));
const isOpenWorkOrder = (order) => order.status !== 'COMPLETE';
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

const handleAuth = (segments, method, options) => {
  if (segments[1] === 'login' && method === 'POST') {
    const { username = '', password = '' } = bodyAsJson(options);
    const worker = state.workers.find(item => item.workerUser === username.trim() && !item.archived);

    if (!worker || worker.workerPW !== password) {
      throw new MockApiError('Invalid username or password', 401);
    }

    worker.lastLoginAt = now();
    touch(worker);
    saveState();

    return createLoginResponse(worker);
  }

  if (segments[1] === 'logout' && method === 'POST') {
    return null;
  }

  throw new MockApiError('Mock auth route not found', 404);
};

const handleWorkers = (segments, method, options) => {
  if (segments.length === 1 && method === 'GET') {
    return activeOnly(state.workers).map(withoutPassword);
  }

  if (segments[1] === 'all-with-archived' && method === 'GET') {
    return state.workers.map(withoutPassword);
  }

  if (segments[1] === 'archived' && method === 'GET') {
    return archivedOnly(state.workers).map(withoutPassword);
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
  saveState();
  return workOrder;
};

const handleWorkOrders = (segments, method, options) => {
  if (segments.length === 1 && method === 'GET') {
    return activeOnly(state.workOrders);
  }

  if (segments[1] === 'all-with-archived' && method === 'GET') {
    return state.workOrders;
  }

  if (segments[1] === 'archived' && method === 'GET') {
    return archivedOnly(state.workOrders);
  }

  if (segments[1] === 'count' && method === 'GET') {
    return activeOnly(state.workOrders).length;
  }

  if (segments.length === 1 && method === 'POST') {
    const payload = bodyAsJson(options);
    const workerRefs = Array.isArray(payload.workers) ? payload.workers : [];
    const company = payload.company?.companyID ? findCompany(payload.company.companyID) : payload.company;
    if (company?.archived) {
      throw new MockApiError('Archived companies cannot be assigned', 409);
    }
    const assignedWorkers = workerRefs
      .map(worker => findWorker(worker.workerID))
      .filter(worker => worker && !worker.archived)
      .map(withoutPassword);
    const workOrder = {
      workOrderID: nextId(state.workOrders, 'workOrderID'),
      workers: assignedWorkers,
      company: company ? clone(company) : null,
      status: assignedWorkers.length ? 'IN_PROCESS' : 'OPEN',
      startDateTime: new Date().toISOString(),
      endDateTime: null,
      comment: payload.comment || '',
      items: [],
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
    return activeOnly(state.workOrders).filter(order => order.company?.companyID === companyID);
  }

  const workOrderID = segments[1];
  const workOrder = findWorkOrder(workOrderID);
  if (!workOrder) throw new MockApiError('Work order not found', 404);

  if (segments.length === 2 && method === 'GET') {
    return workOrder;
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

    if (!workOrder.archived && !canDeleteMistakenWorkOrder) {
      throw new MockApiError('Only archived or empty open work orders can be permanently deleted', 409);
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
    saveState();
    return workOrder;
  }

  if (segments[2] === 'start' && method === 'PUT') {
    ensureWorkOrderCanBeEdited(workOrder);

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
    return setWorkOrderStatus(workOrder, 'COMPLETE');
  }

  if (segments[2] === 'reject' && method === 'PUT') {
    return setWorkOrderStatus(workOrder, 'IN_PROCESS');
  }

  throw new MockApiError('Mock work order route not found', 404);
};

export const resetMockApiState = () => {
  state = hydrateState({
    workers: clone(mockWorkers),
    companies: clone(mockCompanies),
    workOrders: clone(mockWorkOrders),
  });
  saveState();
};

export const mockApiFetch = async (path, options = {}) => {
  await new Promise(resolve => setTimeout(resolve, 150));

  const method = (options.method || 'GET').toUpperCase();
  const segments = path.split('?')[0].split('/').filter(Boolean);

  try {
    if (segments[0] === 'auth') return clone(handleAuth(segments, method, options));
    if (segments[0] === 'workers') return clone(handleWorkers(segments, method, options));
    if (segments[0] === 'companies') return clone(handleCompanies(segments, method, options));
    if (segments[0] === 'workorders') return clone(handleWorkOrders(segments, method, options));
  } catch (error) {
    throw error;
  }

  throw new MockApiError(`Mock route not found: ${method} ${path}`, 404);
};
