import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../services/authService', () => ({ authService: { me: jest.fn(), logout: jest.fn() } }));

const SessionState = () => {
  const { user, loading } = useAuth();
  if (loading) return <span>loading</span>;
  return <span>{user ? `${user.username}:${user.isAdmin}` : 'anonymous'}</span>;
};

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('restores authentication from the server session on startup', async () => {
  authService.me.mockResolvedValue({
    workerID: 7,
    workerUser: 'plee',
    workerFName: 'Pat',
    workerLName: 'Lee',
    workerDisplayName: 'Pat Lee',
    workerEmail: 'plee@test.com',
    lastLoginAt: '2026-07-16T10:00:00',
    admin: true,
  });

  render(
    <AuthProvider><SessionState /></AuthProvider>
  );

  await waitFor(() => expect(screen.getByText('plee:true')).toBeTruthy());
  expect(authService.me).toHaveBeenCalledWith();
  expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ username: 'plee', isAdmin: true, workerID: 7 });
});

test('discards cached auth when the server session is unauthorized', async () => {
  localStorage.setItem('user', '{"username":"stale"}');
  const error = new Error('Unauthorized');
  error.status = 401;
  authService.me.mockRejectedValue(error);

  render(
    <AuthProvider><SessionState /></AuthProvider>
  );

  await waitFor(() => expect(screen.getByText('anonymous')).toBeTruthy());
  expect(localStorage.getItem('user')).toBeNull();
});
