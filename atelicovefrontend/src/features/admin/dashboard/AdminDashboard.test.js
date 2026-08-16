import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../../theme';
import AdminDashboard, { AdminGlobalControls } from './AdminDashboard';
import useAdminDashboard from './useAdminDashboard';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
jest.mock('../../../Components/AuthContext', () => ({
  useAuth: () => ({ user: { workerID: 7, isAdmin: true } }),
}));
jest.mock('./useAdminDashboard');

beforeEach(() => mockNavigate.mockClear());

const DashboardUnderTest = () => <AdminDashboard dashboard={useAdminDashboard()} />;

const renderDashboard = () => render(
  <ThemeProvider theme={theme}>
    <DashboardUnderTest />
  </ThemeProvider>
);

const renderGlobalControls = dashboard => render(
  <ThemeProvider theme={theme}>
    <AdminGlobalControls dashboard={dashboard} />
  </ThemeProvider>
);

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

  renderDashboard();

  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
  expect(screen.getByText('No active projects yet. Create a project to begin tracking operations.')).toBeTruthy();
  expect(screen.getByText('No upcoming deadlines for this month or the next two.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Previous month' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Next month' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'My Calendar' })).toBeTruthy();
  expect(screen.getByText('No assignments')).toBeTruthy();
});

test('opens alert records in a dialog before navigating to a detail page', () => {
  const reviewOrder = {
    workOrderID: 42,
    status: 'IN_REVIEW',
    company: { companyName: 'Atelicove Manufacturing' },
    workers: [{ workerID: 7, firstName: 'Alex', lastName: 'Morgan' }],
  };
  const reviewAlert = {
    id: 'work-order-review',
    label: 'Work orders awaiting review',
    severity: 'warning',
    records: [reviewOrder],
    count: 1,
  };
  useAdminDashboard.mockReturnValue({
    data: { projects: [], workOrders: [reviewOrder], companies: [], workers: [] },
    loading: false,
    error: '',
    query: '',
    setQuery: jest.fn(),
    searchResults: [],
    searchReady: false,
    alertEntries: [reviewAlert],
    workQueue: [reviewAlert],
    deadlines: [],
    upcomingDeadlines: [],
    savingDeadline: false,
    deletingDeadline: false,
    deadlineMessage: null,
    saveDeadline: jest.fn(),
    deleteDeadline: jest.fn(),
    reload: jest.fn(),
  });

  renderGlobalControls(useAdminDashboard());
  fireEvent.click(screen.getByRole('button', { name: 'Alerts (1)' }));
  fireEvent.click(screen.getByRole('button', { name: /Work orders awaiting review/i }));

  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByRole('table', { name: 'Work orders awaiting review records' })).toBeTruthy();
  expect(screen.getByText('Atelicove Manufacturing')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Work Order #42' }));
  expect(mockNavigate).toHaveBeenCalledWith('/admin/workorders/42');
});

test('shows the same assigned projects and work orders as My Assignments', () => {
  useAdminDashboard.mockReturnValue({
    data: {
      projects: [{
        projectID: 2,
        projectName: 'Production Upgrade',
        projectStatus: 'OPEN',
        workOrders: [{ workOrderID: 11, workers: [{ workerID: 7 }] }],
      }],
      workOrders: [
        { workOrderID: 11, status: 'IN_PROCESS', workers: [{ workerID: 7 }] },
        { workOrderID: 12, status: 'OPEN', workers: [{ workerID: 8 }] },
        { workOrderID: 13, status: 'COMPLETE', workers: [{ workerID: 7 }] },
      ],
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
    deadlines: [],
    upcomingDeadlines: [],
    savingDeadline: false,
    deadlineMessage: null,
    saveDeadline: jest.fn(),
    reload: jest.fn(),
  });

  renderDashboard();

  expect(screen.getByRole('button', { name: 'Work Order #11' })).toBeTruthy();
  expect(screen.queryByText('Work Order #12')).toBeNull();
  expect(screen.getByRole('button', { name: 'Work Order #13' })).toBeTruthy();
  expect(screen.getAllByText('Production Upgrade')).toHaveLength(2);
  const assignmentsTable = screen.getByRole('table', { name: 'My assignments' });
  expect(within(assignmentsTable).getByRole('columnheader', { name: 'Assignment' })).toBeTruthy();
  expect(within(assignmentsTable).getByRole('columnheader', { name: 'Type' })).toBeTruthy();
  expect(within(assignmentsTable).getByRole('columnheader', { name: 'Status' })).toBeTruthy();
  expect(within(assignmentsTable).getByText('Project')).toBeTruthy();
  expect(within(assignmentsTable).getAllByText('Work Order')).toHaveLength(2);

  fireEvent.click(screen.getAllByRole('button', { name: 'Production Upgrade' })[1]);
  expect(mockNavigate).toHaveBeenCalledWith('/admin/projects/active', {
    state: { projectStudioEditProjectID: 2 },
  });

  fireEvent.click(screen.getByRole('button', { name: 'Work Order #11' }));
  expect(mockNavigate).toHaveBeenCalledWith('/admin/my-assignments/11');

  fireEvent.click(screen.getByRole('button', { name: /View all assignments/i }));
  expect(mockNavigate).toHaveBeenCalledWith('/admin/my-assignments');
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

  renderDashboard();
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

  renderDashboard();
  fireEvent.click(screen.getByRole('button', {
    name: `View 1 deadline or create deadline on ${dueDate.toLocaleDateString()}`,
  }));

  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Create project deadline' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

  expect(screen.getByRole('heading', { name: 'Edit project deadline' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Create project deadline' })).toBeNull();
});
