import { act, renderHook, waitFor } from '@testing-library/react';
import { apiFetch } from '../../../api';
import useProjectsPage from './useProjectsPage';

jest.mock('../../../api', () => ({ apiFetch: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

test('loads the project page data from the existing endpoints', async () => {
  apiFetch.mockImplementation(path => Promise.resolve({
    '/projects': [{ projectID: 1, projectName: 'Project One' }],
    '/workorders': [{ workOrderID: 2, status: 'OPEN' }],
    '/teams': [{ teamID: 3 }],
    '/companies': [{ companyID: 4, archived: false }],
  }[path]));

  const { result } = renderHook(() => useProjectsPage({ canManage: true }));

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(apiFetch.mock.calls.map(([path]) => path)).toEqual([
    '/projects',
    '/workorders',
    '/teams',
    '/companies',
  ]);
  expect(result.current.visibleProjects).toHaveLength(1);
  expect(result.current.attachableWorkOrders).toHaveLength(1);
  expect(result.current.teams).toHaveLength(1);
  expect(result.current.companies).toHaveLength(1);
});

test('preserves the project create payload', async () => {
  apiFetch.mockImplementation(path => Promise.resolve({
    '/projects': [],
    '/workorders': [],
    '/teams': [],
    '/companies': [],
  }[path]));

  const { result } = renderHook(() => useProjectsPage({ canManage: true }));
  await waitFor(() => expect(result.current.loading).toBe(false));

  act(() => {
    result.current.updateProjectForm({
      projectName: '  New Project  ',
      description: '  Description  ',
      budget: '125.50',
      teamIDs: ['7'],
    });
  });

  apiFetch.mockResolvedValue({
    projectID: 9,
    projectName: 'New Project',
    teams: [],
  });

  await act(async () => {
    await result.current.saveProject({ preventDefault: jest.fn() });
  });

  expect(apiFetch).toHaveBeenLastCalledWith('/projects', {
    method: 'POST',
    body: JSON.stringify({
      projectName: 'New Project',
      description: 'Description',
      budget: 125.5,
      teamIDs: [7],
    }),
  });
});
