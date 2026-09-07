import React from 'react';
import { Table, TableHead } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import theme from '../../../theme';
import TableTitleRow from './TableTitleRow';

test('renders a shared heading row for feature tables', () => {
  render(
    <ThemeProvider theme={theme}>
      <Table>
        <TableHead>
          <TableTitleRow title="Companies" colSpan={5} />
        </TableHead>
      </Table>
    </ThemeProvider>,
  );

  expect(screen.getByRole('heading', { level: 2, name: 'Companies' })).toBeTruthy();
  expect(screen.getByRole('columnheader').getAttribute('colspan')).toBe('5');
});
