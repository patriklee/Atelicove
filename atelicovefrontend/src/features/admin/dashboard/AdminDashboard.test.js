import { render, screen } from '@testing-library/react';
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
    notifications: [],
    savingDeadline: false,
    deadlineMessage: null,
    saveDeadline: jest.fn(),
    reload: jest.fn(),
  });

  render(<AdminDashboard />);

  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy();
  expect(screen.getByText('No active projects yet. Create a project to begin tracking operations.')).toBeTruthy();
  expect(screen.getByText('No operational exceptions require attention.')).toBeTruthy();
  expect(screen.getByText('No upcoming project deadlines are configured.')).toBeTruthy();
});
