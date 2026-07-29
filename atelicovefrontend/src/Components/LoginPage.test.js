import { fireEvent, render, screen } from '@testing-library/react';
import LoginPage from './LoginPage';

jest.mock('./AuthContext', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

jest.mock('../services/authService', () => ({
  authService: { login: jest.fn() },
}));

test('preserves password visibility behavior and accessible control names', () => {
  render(<LoginPage />);

  const password = screen.getByLabelText(/^Password/);
  expect(password.getAttribute('type')).toBe('password');

  fireEvent.click(screen.getByRole('button', { name: 'show password' }));

  expect(password.getAttribute('type')).toBe('text');
  expect(screen.getByRole('button', { name: 'hide password' })).toBeTruthy();
});
