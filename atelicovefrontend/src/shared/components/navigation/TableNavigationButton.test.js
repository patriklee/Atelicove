import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import theme from '../../../theme';
import TableNavigationButton from './TableNavigationButton';

test('provides table navigation presentation without owning the destination', () => {
  const onClick = jest.fn();

  render(
    <ThemeProvider theme={theme}>
      <TableNavigationButton onClick={onClick}>Example entity</TableNavigationButton>
    </ThemeProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Example entity' }));
  expect(onClick).toHaveBeenCalledTimes(1);
});
