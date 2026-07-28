import { getWorkOrderActualPrice, normalizeWorker } from '../../../model';

export const DASHBOARD_SEVERITY = {
  info: { color: 'info', label: 'Info' },
  warning: { color: 'warning', label: 'Attention' },
  error: { color: 'error', label: 'Urgent' },
};

const finiteNumber = value => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.getFullYear() === Number(year)
      && date.getMonth() === Number(month) - 1
      && date.getDate() === Number(day)
      ? date
      : null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function dateKey(value) {
  const date = normalizeDate(value);
  if (!date) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function isDeadlineOverdue(deadline, now = new Date()) {
  const dueDate = normalizeDate(deadline?.dueDate ?? deadline);
  const today = normalizeDate(now);
  return Boolean(dueDate && today && dueDate < today);
}

export function isDeadlineToday(deadline, now = new Date()) {
  return dateKey(deadline?.dueDate ?? deadline) === dateKey(now);
}

export function getUpcomingDeadlines(deadlines = [], now = new Date()) {
  const today = normalizeDate(now);
  if (!today) return [];
  const through = new Date(today.getFullYear(), today.getMonth() + 3, 0);
  const seen = new Set();

  return deadlines
    .filter(deadline => {
      const dueDate = normalizeDate(deadline.dueDate);
      return !deadline.completed && dueDate && dueDate >= today && dueDate <= through;
    })
    .sort((a, b) => normalizeDate(a.dueDate) - normalizeDate(b.dueDate))
    .filter(deadline => {
      const key = `${deadline.projectID}-${deadline.actionItemID ?? dateKey(deadline.dueDate)}-${deadline.itemText}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function groupDeadlinesByDate(deadlines = []) {
  return deadlines.reduce((groups, deadline) => {
    const key = dateKey(deadline.dueDate);
    if (!key) return groups;
    return { ...groups, [key]: [...(groups[key] || []), deadline] };
  }, {});
}

export function getProjectHealth(project = {}) {
  const explicit = finiteNumber(
    project.completionPercentage ?? project.progressPercentage ?? project.progress
  );
  if (explicit !== null) {
    const percent = Math.min(100, Math.max(0, Math.round(explicit)));
    return { percent, label: percent === 100 ? 'Complete' : 'In progress', configured: true };
  }

  const workOrders = Array.isArray(project.workOrders) ? project.workOrders : [];
  if (!workOrders.length) {
    return { percent: null, label: 'No work assigned', configured: false };
  }

  const completed = workOrders.filter(order => order.status === 'COMPLETE').length;
  const percent = Math.round((completed / workOrders.length) * 100);
  return {
    percent,
    label: percent === 100 ? 'Complete' : `${completed} of ${workOrders.length} complete`,
    configured: true,
  };
}

export function getBudgetHealth(project = {}) {
  const budget = finiteNumber(project.budget);
  if (budget === null || budget <= 0) {
    return { configured: false, label: 'Not configured', severity: 'info' };
  }

  const explicitCost = finiteNumber(project.actualCost);
  const spent = explicitCost ?? (project.workOrders || [])
    .reduce((total, order) => total + getWorkOrderActualPrice(order), 0);
  const percent = Math.round((spent / budget) * 100);
  let severity = 'success';
  let label = 'Healthy';
  if (percent >= 100) {
    severity = 'error';
    label = 'Over budget';
  } else if (percent >= 90) {
    severity = 'error';
    label = 'Near limit';
  } else if (percent >= 75) {
    severity = 'warning';
    label = 'Monitor';
  }

  return { configured: true, budget, spent, percent, severity, label };
}

export function groupSearchResults(data = {}, query = '') {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];
  const includesQuery = (...values) => values.some(value =>
    String(value ?? '').toLowerCase().includes(normalizedQuery)
  );

  const groups = [
    {
      type: 'Projects',
      items: (data.projects || []).filter(project =>
        includesQuery(project.projectName, project.projectID, project.description)
      ).map(project => ({
        id: project.projectID,
        primary: project.projectName || `Project #${project.projectID}`,
        secondary: (project.projectStatus || 'OPEN').replaceAll('_', ' '),
        path: `/admin/projects/${project.projectID}`,
      })),
    },
    {
      type: 'Work Orders',
      items: (data.workOrders || []).filter(order =>
        includesQuery(order.workOrderID, order.comment, order.company?.companyName)
      ).map(order => ({
        id: order.workOrderID,
        primary: `Work order #${order.workOrderID}`,
        secondary: order.comment || order.company?.companyName || 'No description',
        path: `/admin/workorders/${order.workOrderID}`,
      })),
    },
    {
      type: 'Companies',
      items: (data.companies || []).filter(company =>
        includesQuery(company.companyName, company.companyAddress, company.companyEmail)
      ).map(company => ({
        id: company.companyID,
        primary: company.companyName || `Company #${company.companyID}`,
        secondary: company.companyAddress || company.companyEmail || 'No contact details',
        path: `/admin/companies/${company.companyID}`,
      })),
    },
    {
      type: 'Workers',
      items: (data.workers || []).map(normalizeWorker).filter(worker =>
        includesQuery(worker.displayName, worker.firstName, worker.lastName, worker.username, worker.email)
      ).map(worker => ({
        id: worker.workerID,
        primary: worker.displayName || `${worker.firstName} ${worker.lastName}`.trim() || `Worker #${worker.workerID}`,
        secondary: worker.roleTitle || worker.email || 'Worker',
        path: `/admin/workers/${worker.workerID}`,
      })),
    },
  ];

  return groups
    .map(group => ({ ...group, items: group.items.slice(0, 5) }))
    .filter(group => group.items.length);
}

export function getDashboardDeadlines(projects = [], now = new Date()) {
  return projects.flatMap(project => (project.actionItems || [])
    .filter(item => !item.completed && item.dueDate)
    .map(item => {
      const dueDate = normalizeDate(item.dueDate);
      const today = normalizeDate(now);
      const daysUntil = dueDate && today
        ? Math.round((dueDate.getTime() - today.getTime()) / 86400000)
        : null;
      return {
        ...item,
        projectID: project.projectID,
        projectName: project.projectName || `Project #${project.projectID}`,
        dueDate,
        daysUntil,
        overdue: isDeadlineOverdue(dueDate, today),
        path: `/admin/projects/${project.projectID}`,
      };
    }))
    .filter(item => item.dueDate)
    .sort((a, b) => a.dueDate - b.dueDate);
}

export function getWorkQueue(data = {}, now = new Date()) {
  const projects = data.projects || [];
  const workOrders = data.workOrders || [];
  const overdueDeadlines = getDashboardDeadlines(projects, now).filter(deadline => deadline.overdue);
  const entries = [
    {
      id: 'overdue-deadlines',
      label: 'Overdue project deadlines',
      count: overdueDeadlines.length,
      severity: 'error',
      path: overdueDeadlines[0]?.path || '/admin',
    },
    {
      id: 'work-order-review',
      label: 'Work orders awaiting review',
      count: workOrders.filter(order => order.status === 'IN_REVIEW').length,
      severity: 'warning',
      path: '/admin/manage-workorders',
    },
    {
      id: 'project-review',
      label: 'Projects awaiting review',
      count: projects.filter(project => project.projectStatus === 'IN_REVIEW').length,
      severity: 'warning',
      path: '/admin/projects/active',
    },
    {
      id: 'projects-without-work',
      label: 'Projects without assigned work',
      count: projects.filter(project => !(project.workOrders || []).length).length,
      severity: 'warning',
      path: '/admin/projects/active',
    },
    {
      id: 'unassigned-work',
      label: 'Unassigned work orders',
      count: workOrders.filter(order =>
        ['OPEN', 'IN_PROCESS'].includes(order.status) && !(order.workers || []).length
      ).length,
      severity: 'error',
      path: '/admin/manage-workorders',
    },
  ];

  return entries.filter(entry => entry.count > 0);
}

export function getDashboardNotifications(data = {}, now = new Date()) {
  const deadlines = getDashboardDeadlines(data.projects || [], now);
  const budgetAlerts = (data.projects || []).map(project => ({
    project,
    budget: getBudgetHealth(project),
  })).filter(({ budget }) => budget.configured && budget.percent >= 90);

  return [
    ...deadlines.filter(deadline => deadline.daysUntil <= 7).map(deadline => ({
      id: `deadline-${deadline.actionItemID}`,
      severity: deadline.overdue ? 'error' : 'warning',
      message: deadline.overdue
        ? `${deadline.itemText} is overdue`
        : `${deadline.itemText} is due within 7 days`,
      entity: deadline.projectName,
      date: deadline.dueDate,
      path: deadline.path,
    })),
    ...budgetAlerts.map(({ project, budget }) => ({
      id: `budget-${project.projectID}`,
      severity: budget.percent >= 100 ? 'error' : 'warning',
      message: `${project.projectName || `Project #${project.projectID}`} is ${budget.label.toLowerCase()}`,
      entity: `${budget.percent}% of budget used`,
      date: null,
      path: `/admin/projects/${project.projectID}`,
    })),
  ].slice(0, 8);
}
