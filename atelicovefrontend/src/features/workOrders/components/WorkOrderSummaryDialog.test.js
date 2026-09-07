import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import theme from '../../../theme';
import WorkOrderSummaryDialog from './WorkOrderSummaryDialog';

test('renders work-order items and delegates closing to its parent page', () => {
  const onClose = jest.fn();

  render(
    <ThemeProvider theme={theme}>
      <WorkOrderSummaryDialog
        workOrder={{
          workOrderID: 42,
          items: [{ workOrderItemID: 7, itemName: 'Inspection', quantity: 2, price: 25 }],
        }}
        onClose={onClose}
      />
    </ThemeProvider>,
  );

  expect(screen.getByRole('heading', { name: 'Work Order #42 Items' })).toBeTruthy();
  expect(screen.getByText('Inspection')).toBeTruthy();
  expect(screen.getByText('$25.00')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('uses the shared table empty state when no items exist', () => {
  render(
    <ThemeProvider theme={theme}>
      <WorkOrderSummaryDialog workOrder={{ workOrderID: 43, items: [] }} onClose={() => {}} />
    </ThemeProvider>,
  );

  expect(screen.getByText('No items are associated with this work order.')).toBeTruthy();
});
