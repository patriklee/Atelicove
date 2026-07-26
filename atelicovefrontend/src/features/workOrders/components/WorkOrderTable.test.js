import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import WorkOrderTable from './WorkOrderTable';

test('preserves work-order columns and complete-order actions', () => {
  const order = {
    workOrderID: 12,
    status: 'COMPLETE',
    company: { companyName: 'Example Company' },
    workers: [{ workerID: 2, firstName: 'Alex', lastName: 'Worker' }],
    items: [],
  };
  const onView = jest.fn();
  const onArchive = jest.fn();

  render(<WorkOrderTable workOrders={[order]} onView={onView} onArchive={onArchive} />);

  ['Work Order', 'Status', 'Workers', 'Company', 'Start', 'Price', 'Actions'].forEach(column => {
    expect(screen.getByText(column)).toBeTruthy();
  });

  fireEvent.click(screen.getByRole('button', { name: '#12' }));
  fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

  expect(onView).toHaveBeenCalledWith(order);
  expect(onArchive).toHaveBeenCalledWith(order);
});
