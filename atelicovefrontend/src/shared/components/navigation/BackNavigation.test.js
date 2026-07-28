import { fireEvent, render, screen } from '@testing-library/react';
import BackNavigation from './BackNavigation';
import { useLocation, useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

test('returns to the previous in-app page after normal navigation', () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  useLocation.mockReturnValue({ key: 'in-app-entry' });

  render(<BackNavigation fallback="/admin/projects/active" />);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));

  expect(navigate).toHaveBeenCalledWith(-1);
});

test('uses the fallback when the page is loaded directly', () => {
  const navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  useLocation.mockReturnValue({ key: 'default' });

  render(<BackNavigation fallback="/admin/projects/active" />);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));

  expect(navigate).toHaveBeenCalledWith('/admin/projects/active', { replace: true });
});
