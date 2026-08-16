import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import AdminHomePage from './AdminHomePage';
import useAdminDashboard from './dashboard/useAdminDashboard';

let mockPathname = '/admin/projects/active';

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname }),
  Outlet: () => <div>Nested admin page</div>,
}));
jest.mock('../../Components/AuthContext', () => ({
  useAuth: () => ({ logout: jest.fn(), user: { isAdmin: true } }),
}));
jest.mock('./AdminSidebar', () => () => <nav>Admin navigation</nav>);
jest.mock('./dashboard/useAdminDashboard');
jest.mock('./dashboard/AdminDashboard', () => ({
  __esModule: true,
  default: ({ headerActions }) => <div>Dashboard content {headerActions}</div>,
  AdminGlobalControls: () => <div>Global Search and Alerts</div>,
}));

const renderPage = () => render(
  <ThemeProvider theme={theme}>
    <AdminHomePage />
  </ThemeProvider>
);

beforeEach(() => {
  mockPathname = '/admin/projects/active';
  useAdminDashboard.mockClear();
  useAdminDashboard.mockReturnValue({});
});

test('loads and displays one global control area for nested admin pages', () => {
  renderPage();

  expect(screen.getByText('Global Search and Alerts')).toBeTruthy();
  expect(screen.getByText('Nested admin page')).toBeTruthy();
  expect(useAdminDashboard).toHaveBeenCalledTimes(1);
});

test('injects the same global control area into the Dashboard header', () => {
  mockPathname = '/admin';
  renderPage();

  expect(screen.getByText('Dashboard content')).toBeTruthy();
  expect(screen.getByText('Global Search and Alerts')).toBeTruthy();
  expect(useAdminDashboard).toHaveBeenCalledTimes(1);
});

test('omits global controls and their data load from Settings', () => {
  mockPathname = '/admin/settings';
  renderPage();

  expect(screen.queryByText('Global Search and Alerts')).toBeNull();
  expect(screen.getByText('Nested admin page')).toBeTruthy();
  expect(useAdminDashboard).not.toHaveBeenCalled();
});
