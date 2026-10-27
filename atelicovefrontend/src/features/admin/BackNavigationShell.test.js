import { render, screen } from '@testing-library/react';
import AdminHomePage from './AdminHomePage';
import WorkerHomePage from '../workers/WorkerHomePage';
import { useLocation } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: () => jest.fn(),
  Outlet: () => <div>Route content</div>,
}));
jest.mock('../../Components/AuthContext', () => ({
  useAuth: () => ({ user: {}, logout: jest.fn() }),
}));
jest.mock('./AdminSidebar', () => () => null);
jest.mock('../workers/components/WorkerNavigation', () => () => null);
jest.mock('./dashboard/useAdminDashboard', () => () => ({}));
jest.mock('./dashboard/AdminDashboard', () => ({
  __esModule: true,
  default: () => <div>Dashboard</div>,
  AdminGlobalControls: () => null,
}));
// History behavior is covered with a real BrowserRouter in BackNavigation.test.js.
jest.mock('../../shared/components/navigation', () => ({
  BackNavigation: () => <button>Back</button>,
}));

test.each([
  ['/admin', AdminHomePage, 0],
  ['/admin/', AdminHomePage, 0],
  ['/admin/workers', AdminHomePage, 1],
  ['/admin/workers/42', AdminHomePage, 1],
  ['/admin/companies/7', AdminHomePage, 1],
  ['/admin/documents', AdminHomePage, 1],
  ['/admin/settings', AdminHomePage, 1],
  ['/worker', WorkerHomePage, 0],
  ['/worker/my-assignments', WorkerHomePage, 0],
  ['/worker/my-assignments/3', WorkerHomePage, 1],
  ['/worker/projects/2/edit', WorkerHomePage, 1],
])('places the expected Back control on %s', (pathname, Shell, count) => {
  useLocation.mockReturnValue({ pathname });
  render(<Shell />);
  expect(screen.queryAllByRole('button', { name: 'Back' })).toHaveLength(count);
});
