export function normalizeWorker(worker = {}) {
  return {
    ...worker,
    workerID: worker.workerID ?? '',
    firstName: worker.workerFName ?? '',
    lastName: worker.workerLName ?? '',
    displayName: worker.workerDisplayName ?? '',
    username: worker.workerUser ?? '',
    email: worker.workerEmail ?? '',
    isAdmin: Boolean(worker.admin),
    role: worker.roleTitle ?? '',
    roleTitle: worker.roleTitle ?? '',
    roleDescription: worker.roleDescription ?? '',
  };
}

export function workerPayload(worker = {}) {
  return {
    workerFName: worker.firstName ?? worker.workerFName ?? '',
    workerLName: worker.lastName ?? worker.workerLName ?? '',
    workerDisplayName: worker.displayName ?? worker.workerDisplayName ?? '',
    workerUser: worker.username ?? worker.workerUser ?? '',
    workerEmail: worker.email ?? worker.workerEmail ?? '',
    workerPW: worker.password,
    roleTitle: worker.roleTitle ?? worker.role ?? '',
    roleDescription: worker.roleDescription ?? '',
    admin: Boolean(worker.isAdmin || worker.role === 'ADMIN'),
  };
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function formatMoney(value) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function getWorkOrderWorkers(workOrder = {}) {
  if (Array.isArray(workOrder.workers)) return workOrder.workers.map(normalizeWorker);
  return [];
}

export function getWorkOrderActualPrice(workOrder = {}) {
  if (workOrder.actualPrice != null) return Number(workOrder.actualPrice) || 0;
  if (workOrder.totalPrice != null) return Number(workOrder.totalPrice) || 0;
  if (workOrder.price != null) return Number(workOrder.price) || 0;
  const items = workOrder.items || workOrder.workOrderItems || workOrder.woItems || [];
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity ?? item.itemQuantity ?? 1) || 0;
    const unitPrice = Number(item.price ?? item.itemPrice ?? item.cost ?? 0) || 0;
    return sum + quantity * unitPrice;
  }, 0);
}
