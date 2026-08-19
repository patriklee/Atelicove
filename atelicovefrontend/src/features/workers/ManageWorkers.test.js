import React from 'react';
import { ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../api';
import theme from '../../theme';
import ManageWorkers from './ManageWorkers';

jest.mock('../../api', () => ({ apiFetch: jest.fn() }));
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ key: 'default' }),
  useNavigate: () => jest.fn(),
  useParams: jest.fn(),
}));
jest.mock('../../Components/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'admin', isAdmin: true } }),
}));

const renderPage = (workerID) => {
  useParams.mockReturnValue(workerID ? { workerID } : {});
  return render(
  <ThemeProvider theme={theme}>
    <ManageWorkers />
  </ThemeProvider>,
  );
};

beforeEach(() => {
  apiFetch.mockClear();
  apiFetch.mockImplementation(path => Promise.resolve(path === '/workers' ? [{
    workerID: 42,
    workerFName: 'Test',
    workerLName: 'Worker',
    admin: false,
  }] : []));
});

test('hides Back navigation for the normal manage-workers route', async () => {
  renderPage();

  expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(3));
});

test('shows Back navigation when a worker is supplied by the route', async () => {
  renderPage('42');

  expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(3));
});
