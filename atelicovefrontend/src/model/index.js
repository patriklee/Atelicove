export function normalizeWorker(worker = {}) {
  return {
    workerID: worker.workerID ?? worker.id ?? worker.workerId ?? '',
    firstName: worker.firstName ?? worker.first_name ?? '',
    lastName: worker.lastName ?? worker.last_name ?? '',
    role: worker.role ?? '',
    email: worker.email ?? '',
    ...worker,
  };
}

export function workerPayload(worker = {}) {
  return {
    firstName: worker.firstName ?? '',
    lastName: worker.lastName ?? '',
    email: worker.email ?? '',
    phone: worker.phone ?? '',
    role: worker.role ?? 'WORKER',
    password: worker.password,
    isAdmin: Boolean(worker.isAdmin || worker.role === 'ADMIN'),
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
  if (Array.isArray(workOrder.workers)) return workOrder.workers;
  if (Array.isArray(workOrder.assignedWorkers)) return workOrder.assignedWorkers;
  if (Array.isArray(workOrder.workerList)) return workOrder.workerList;
  if (Array.isArray(workOrder.teams)) return workOrder.teams.flatMap((team) => team.workers || team.members || []);
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
