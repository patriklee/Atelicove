import React from 'react';
import { ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import MetricSummary from './MetricSummary';
import { icons } from '../../icons';
import theme from '../../../theme';

test('renders supplied metrics in a labelled summary region', () => {
  render(
    <ThemeProvider theme={theme}>
      <MetricSummary
        ariaLabel="Worker summary"
        metrics={[
          { label: 'Active Workers', value: 12, detail: 'Currently active', icon: icons.workers },
          { label: 'Teams', value: 3, detail: 'Active teams' },
        ]}
      />
    </ThemeProvider>,
  );

  const summary = screen.getByRole('region', { name: 'Worker summary' });
  expect(within(summary).getByText('Active Workers')).toBeTruthy();
  expect(within(summary).getByText('12')).toBeTruthy();
  expect(within(summary).getByText('Currently active')).toBeTruthy();
  expect(within(summary).getByText('Teams')).toBeTruthy();
  expect(within(summary).getByText('3')).toBeTruthy();
});
