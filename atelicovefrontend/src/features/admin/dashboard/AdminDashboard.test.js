import { fireEvent, render, screen } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import useAdminDashboard from './useAdminDashboard';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('./useAdminDashboard');

test('keeps an empty dashboard useful and stable', () => {
  useAdminDashboard.mockReturnValue({
    data: { projects: [], workOrders: [], companies: [], workers: [] },
    loading: false,
    error: '',
    query: '',
    setQuery: jest.fn(),
    searchResults: [],
    searchReady: false,
    workQueue: [],
    deadlines: [],
    upcomingDeadlines: [],
    savingDeadline: false,
    deadlineMessage: null,
    saveDeadline: jest.fn(),
    reload: jest.fn(),
  });

  render(<AdminDashboard />);

  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
  expect(screen.getByText('No active projects yet. Create a project to begin tracking operations.')).toBeTruthy();
  expect(screen.getByText('No operational exceptions require attention.')).toBeTruthy();
  expect(screen.getByText('No upcoming deadlines for this month or the next two.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Previous month' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Next month' })).toBeTruthy();
});

test('selecting a calendar date opens one create dialog', () => {
  useAdminDashboard.mockReturnValue({
    data: { projects: [], workOrders: [], companies: [], workers: [] },
    loading: false,
    error: '',
    query: '',
    setQuery: jest.fn(),
    searchResults: [],
    searchReady: false,
    workQueue: [],
    deadlines: [],
    upcomingDeadlines: [],
    savingDeadline: false,
    deadlineMessage: null,
    saveDeadline: jest.fn(),
    reload: jest.fn(),
  });

  render(<AdminDashboard />);
  fireEvent.click(screen.getAllByRole('button', { name: /Create deadline on/i })[10]);

  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Create project deadline' })).toBeTruthy();
});

test('selecting a day with a deadline offers the existing item in the create/edit dialog', () => {
  const dueDate = new Date();
  dueDate.setDate(15);
  const actionItem = {
    actionItemID: 9,
    itemText: 'Confirm inspection',
    dueDate,
    completed: false,
  };
  const deadline = {
    ...actionItem,
    projectID: 12,
    projectName: 'Office Renovation',
    daysUntil: 0,
    overdue: false,
  };

  useAdminDashboard.mockReturnValue({
    data: {
      projects: [{
        projectID: 12,
        projectName: 'Office Renovation',
        projectStatus: 'OPEN',
        actionItems: [actionItem],
      }],
      workOrders: [],
      companies: [],
      workers: [],
    },
    loading: false,
    error: '',
    query: '',
    setQuery: jest.fn(),
    searchResults: [],
    searchReady: false,
    workQueue: [],
    deadlines: [deadline],
    upcomingDeadlines: [deadline],
    savingDeadline: false,
    deadlineMessage: null,
    saveDeadline: jest.fn(),
    reload: jest.fn(),
  });

  render(<AdminDashboard />);
  fireEvent.click(screen.getByRole('button', {
    name: `View 1 deadline or create deadline on ${dueDate.toLocaleDateString()}`,
  }));

  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Create project deadline' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', {
    name: 'Confirm inspection Office Renovation',
  }));

  expect(screen.getByRole('heading', { name: 'Edit project deadline' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Create project deadline' })).toBeNull();
});
