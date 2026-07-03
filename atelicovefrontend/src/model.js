export const normalizeWorker = (worker = {}) => ({
  workerID: worker.workerID ?? worker.workerId ?? 0,
  firstName: worker.workerFName ?? worker.firstName ?? '',
  lastName: worker.workerLName ?? worker.lastName ?? '',
  displayName: worker.workerDisplayName ?? worker.displayName ?? '',
  username: worker.workerUser ?? worker.username ?? '',
  email: worker.workerEmail ?? worker.email ?? '',
  isAdmin: worker.admin ?? worker.isAdmin ?? false,
  lastLoginAt: worker.lastLoginAt ?? null,
  createdAt: worker.createdAt ?? null,
  lastModifiedAt: worker.lastModifiedAt ?? null,
  archived: worker.archived ?? false,
  archivedAt: worker.archivedAt ?? null,
});

export const workerPayload = (worker) => ({
  workerFName: worker.firstName.trim(),
  workerLName: worker.lastName.trim(),
  workerDisplayName: worker.displayName?.trim?.() ?? '',
  workerUser: worker.username.trim(),
  workerEmail: worker.email?.trim?.() ?? '',
  workerPW: worker.password,
  admin: Boolean(worker.admin ?? worker.isAdmin),
});

export const getWorkOrderWorkers = (workOrder = {}) =>
  Array.isArray(workOrder.workers) ? workOrder.workers.map(normalizeWorker) : [];

export const getWorkOrderActualPrice = (workOrder = {}) =>
  (workOrder.items || []).reduce((sum, item) => (
    sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0))
  ), 0);

export const formatMoney = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : 'Not set';
