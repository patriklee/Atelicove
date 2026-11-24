import { act, renderHook, waitFor } from '@testing-library/react';
import { apiFetch } from '../../../shared/api';
import useProjectsPage from './useProjectsPage';

jest.mock('../../../shared/api', () => ({ apiFetch: jest.fn() }));

test('loads and updates the route project, then reports the saved project', async () => {
  const project = { projectID: 42, projectName: 'Original', teams: [] };
  const onSaved = jest.fn();
  apiFetch.mockImplementation(path => Promise.resolve(path === '/projects/42' ? project : []));
  const { result } = renderHook(() => useProjectsPage({ canManage: true, mode: 'edit', routeProjectID: '42', onSaved }));
  await waitFor(() => expect(result.current.projectForm.projectName).toBe('Original'));
  act(() => result.current.updateProjectForm({ projectName: 'Updated' }));
  apiFetch.mockResolvedValue({ ...project, projectName: 'Updated' });
  await act(async () => result.current.saveProject({ preventDefault: jest.fn() }));
  expect(apiFetch).toHaveBeenLastCalledWith('/projects/42', {
    method: 'PUT', body: JSON.stringify({ projectName: 'Updated', description: null, budget: null, teamIDs: [] }),
  });
  expect(result.current.selectedProject.projectName).toBe('Updated');
  expect(onSaved).toHaveBeenCalledWith({ ...project, projectName: 'Updated' });
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('loads the project page data from the existing endpoints', async () => {
  apiFetch.mockImplementation(path => Promise.resolve({
    '/projects/1': { projectID: 1, projectName: 'Project One' },
    '/workorders': [{ workOrderID: 2, status: 'OPEN' }],
    '/teams': [{ teamID: 3 }],
    '/companies': [{ companyID: 4, archived: false }],
  }[path]));

  const { result } = renderHook(() => useProjectsPage({ canManage: true, mode: 'workspace', routeProjectID: '1' }));

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(apiFetch.mock.calls.map(([path]) => path)).toEqual([
    '/projects/1',
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

  const { result } = renderHook(() => useProjectsPage({ canManage: true, mode: 'create' }));
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
