import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmationDialog from './ConfirmationDialog';

test('preserves cancel-then-confirm button order and calls both handlers', () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();

  render(
    <ConfirmationDialog
      open
      title="Delete Company"
      confirmLabel="Delete"
      confirmColor="error"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <span>Confirmation details</span>
    </ConfirmationDialog>
  );

  expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual(['Cancel', 'Delete']);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
