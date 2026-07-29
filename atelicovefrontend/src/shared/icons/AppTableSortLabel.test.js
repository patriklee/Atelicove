import { fireEvent, render, screen } from '@testing-library/react';
import {
  Table,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import AppTableSortLabel from './AppTableSortLabel';

test('preserves MUI sort-label interaction with the shared Iconoir indicator', () => {
  const handleClick = jest.fn();

  render(
    <Table>
      <TableHead>
        <TableRow>
          <TableCell sortDirection="asc">
            <AppTableSortLabel active direction="asc" onClick={handleClick}>
              Work order
            </AppTableSortLabel>
          </TableCell>
        </TableRow>
      </TableHead>
    </Table>
  );

  const sortControl = screen.getByRole('button', { name: 'Work order' });
  fireEvent.click(sortControl);

  expect(handleClick).toHaveBeenCalledTimes(1);
});
