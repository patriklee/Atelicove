import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import theme from '../../../theme';
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActionsProvider,
  PageSections,
  PageSurface,
} from './PageLayout';

const renderWithTheme = children => render(
  <ThemeProvider theme={theme}>{children}</ThemeProvider>,
);

test('composes the shared page geometry without owning feature content', () => {
  renderWithTheme(
    <PageContent data-testid="page-content">
      <PageContainer data-testid="page-container">
        <PageHeader title="Companies" subtitle="Manage company records." />
        <PageSections>
          <PageSurface>Company form</PageSurface>
        </PageSections>
      </PageContainer>
    </PageContent>,
  );

  expect(screen.getByRole('main')).toBe(screen.getByTestId('page-content'));
  expect(screen.getByRole('heading', { level: 1, name: 'Companies' })).toBeTruthy();
  expect(screen.getByText('Manage company records.')).toBeTruthy();
  expect(screen.getByText('Company form')).toBeTruthy();
});

test('uses provided header actions before actions supplied by the shell', () => {
  const { rerender } = renderWithTheme(
    <PageHeaderActionsProvider actions={<button>Shell action</button>}>
      <PageHeader title="Workers" />
    </PageHeaderActionsProvider>,
  );

  expect(screen.getByRole('button', { name: 'Shell action' })).toBeTruthy();

  rerender(
    <ThemeProvider theme={theme}>
      <PageHeaderActionsProvider actions={<button>Shell action</button>}>
        <PageHeader title="Workers" actions={<button>Page action</button>} />
      </PageHeaderActionsProvider>
    </ThemeProvider>,
  );

  expect(screen.getByRole('button', { name: 'Page action' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Shell action' })).toBeNull();
});
