import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import theme from '../../../theme';
import WorkerNavigation from './WorkerNavigation';

test('keeps worker routes and logout intent inside worker navigation', () => {
  const onNavigate = jest.fn();
  const onLogout = jest.fn();

  render(
    <ThemeProvider theme={theme}>
      <WorkerNavigation
        pathname="/worker/assigned"
        user={{ firstName: 'Pat' }}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </ThemeProvider>,
  );

  fireEvent.click(screen.getByText('View Assigned Work'));
  expect(onNavigate).toHaveBeenCalledWith('/worker/assigned');

  fireEvent.click(screen.getByText('Logout'));
  expect(onLogout).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Welcome, Pat. What are we creating today?')).toBeTruthy();
});
