import {
  getBudgetHealth,
  getDashboardDeadlines,
  getProjectHealth,
  getWorkQueue,
  groupSearchResults,
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
      expect.objectContaining({ id: 'unassigned-work', count: 1, severity: 'error' }),
    ]));
  });
});
