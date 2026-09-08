import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../shared/api';
import theme from '../../theme';
import ManageCompanies from './ManageCompanies';

jest.mock('../../shared/api', () => ({ apiFetch: jest.fn() }));
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ key: 'default' }),
  useNavigate: () => jest.fn(),
  useParams: jest.fn(),
}));
jest.mock('../../Components/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'admin', isAdmin: true } }),
}));

const renderPage = companyID => {
  useParams.mockReturnValue(companyID ? { companyID } : {});
  return render(
    <ThemeProvider theme={theme}>
      <ManageCompanies />
    </ThemeProvider>,
  );
};

beforeEach(() => {
  apiFetch.mockClear();
  apiFetch.mockImplementation(path => Promise.resolve(path === '/companies/all' ? [{
    companyID: 7,
    companyName: 'Example Company',
    archived: false,
  }] : []));
});

test('keeps the standard management route free of contextual back navigation', async () => {
  renderPage();

  expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  expect(screen.getByRole('heading', { name: 'Create Company' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Edit Company' })).toBeTruthy();
  await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
});

test('shows contextual back navigation when editing a route-selected company', async () => {
  renderPage('7');

  expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
});
