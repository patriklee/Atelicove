import {
  getBudgetHealth,
  getDashboardAlertEntries,
  getDashboardDeadlines,
  getUpcomingDeadlines,
  getProjectHealth,
  getWorkQueue,
  groupSearchResults,
  isDeadlineOverdue,
  isDeadlineToday,
  normalizeDate,
} from './dashboardUtils';

describe('dashboard selectors', () => {
  test('derives project completion from completed associated work orders', () => {
    expect(getProjectHealth({
      workOrders: [{ status: 'COMPLETE' }, { status: 'OPEN' }, { status: 'COMPLETE' }],
    })).toEqual({ percent: 67, label: '2 of 3 complete', configured: true });
    expect(getProjectHealth({ workOrders: [] })).toEqual({
      percent: null,
      label: 'No work assigned',
      configured: false,
    });
  });

  test.each([
    [74, 'success', 'Healthy'],
    [75, 'warning', 'Monitor'],
    [90, 'error', 'Near limit'],
    [100, 'error', 'Over budget'],
  ])('classifies %s percent budget usage', (actualCost, severity, label) => {
    expect(getBudgetHealth({ budget: 100, actualCost })).toMatchObject({
      configured: true,
      percent: actualCost,
      severity,
      label,
    });
  });

  test('returns an honest state when budget is unavailable', () => {
    expect(getBudgetHealth({ budget: null })).toEqual({
      configured: false,
      label: 'Not configured',
      severity: 'info',
    });
  });

  test('groups search matches and supplies existing detail routes', () => {
    const groups = groupSearchResults({
      projects: [{ projectID: 12, projectName: 'North Annex', projectStatus: 'OPEN' }],
      workOrders: [{ workOrderID: 81, comment: 'North panel' }],
      companies: [{ companyID: 4, companyName: 'Northwind' }],
      workers: [{ workerID: 6, workerFName: 'Nora', workerLName: 'North' }],
    }, 'north');

    expect(groups.map(group => group.type)).toEqual(['Projects', 'Work Orders', 'Companies', 'Workers']);
    expect(groups[0].items[0].path).toBe('/admin/projects/12');
    expect(groupSearchResults({}, 'n')).toEqual([]);
  });

  test('renders overdue deadlines and urgent queue entries from real data', () => {
    const now = new Date('2026-07-27T12:00:00');
    const projects = [{
      projectID: 1,
      projectName: 'Plant upgrade',
      projectStatus: 'OPEN',
      workOrders: [],
      actionItems: [{ actionItemID: 3, itemText: 'Submit permit', dueDate: '2026-07-25T17:00:00', completed: false }],
    }];
    const data = {
      projects,
      workOrders: [{ workOrderID: 9, status: 'OPEN', workers: [] }],
    };

    expect(getDashboardDeadlines(projects, now)[0]).toMatchObject({ overdue: true, projectID: 1 });
    expect(getWorkQueue(data, now)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'overdue-deadlines', count: 1, severity: 'error' }),
      expect.objectContaining({ id: 'unassigned-work', count: 1, severity: 'error' }),
    ]));
    getDashboardAlertEntries(data, now).forEach(alert => {
      expect(alert.count).toBe(alert.records.length);
    });
  });

  test('normalizes deadline dates without time or timezone boundary errors', () => {
    const today = new Date('2026-07-27T23:59:59');
    expect(normalizeDate('2026-07-27T00:00:00Z')).toEqual(new Date(2026, 6, 27));
    expect(isDeadlineToday('2026-07-27T00:00:00Z', today)).toBe(true);
    expect(isDeadlineOverdue('2026-07-27T00:00:00Z', today)).toBe(false);
    expect(isDeadlineOverdue('2026-07-26T23:59:59', today)).toBe(true);
  });

  test('lists unique incomplete deadlines through the next two calendar months', () => {
    const now = new Date('2026-07-27T12:00:00');
    const deadlines = [
      { projectID: 1, actionItemID: 1, itemText: 'Past', dueDate: new Date(2026, 6, 26) },
      { projectID: 1, actionItemID: 2, itemText: 'Today', dueDate: new Date(2026, 6, 27) },
      { projectID: 1, actionItemID: 3, itemText: 'Boundary', dueDate: new Date(2026, 8, 30) },
      { projectID: 1, actionItemID: 4, itemText: 'Next month', dueDate: new Date(2026, 7, 2) },
      { projectID: 1, actionItemID: 5, itemText: 'Beyond', dueDate: new Date(2026, 9, 1) },
      { projectID: 1, actionItemID: 6, itemText: 'Completed', dueDate: new Date(2026, 7, 1), completed: true },
      { projectID: 1, actionItemID: 2, itemText: 'Today', dueDate: new Date(2026, 6, 27) },
    ];

    expect(getUpcomingDeadlines(deadlines, now).map(item => item.itemText))
      .toEqual(['Today', 'Next month', 'Boundary']);
  });
});
