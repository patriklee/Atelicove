import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminRoute, WorkerRoute } from './ProtectedRoute';
import { useAuth } from './AuthContext';

jest.mock('./AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <span>{to}</span>,
  Outlet: () => <span>allowed</span>,
  useLocation: () => ({ pathname: '/requested' }),
}), { virtual: true });

const renderGuard = Guard => render(<Guard />);

test('redirects an authenticated worker away from admin routes', () => {
  useAuth.mockReturnValue({ loading: false, isAuthenticated: () => true, isAdmin: () => false });
  renderGuard(AdminRoute);
  expect(screen.getByText('/unauthorized')).toBeTruthy();
});

test('redirects an admin away from worker-only routes', () => {
  useAuth.mockReturnValue({ loading: false, isAuthenticated: () => true, isAdmin: () => true });
  renderGuard(WorkerRoute);
  expect(screen.getByText('/admin/projects/active')).toBeTruthy();
});

test('redirects an anonymous worker-route request to login', () => {
  useAuth.mockReturnValue({ loading: false, isAuthenticated: () => false, isAdmin: () => false });
  renderGuard(WorkerRoute);
  expect(screen.getByText('/login')).toBeTruthy();
});
