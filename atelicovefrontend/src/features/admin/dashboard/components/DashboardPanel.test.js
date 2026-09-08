import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import theme from '../../../../theme';
import { DashboardPanel, DashboardSectionHeading } from './DashboardPanel';

test('composes a dashboard-owned panel from shared surface rules', () => {
  render(
    <ThemeProvider theme={theme}>
      <DashboardPanel>
        <DashboardSectionHeading title="Project Overview" subtitle="Active project health" />
      </DashboardPanel>
    </ThemeProvider>,
  );

  expect(screen.getByRole('heading', { level: 2, name: 'Project Overview' })).toBeTruthy();
  expect(screen.getByText('Active project health')).toBeTruthy();
});
