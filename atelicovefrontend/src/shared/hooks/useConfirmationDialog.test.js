import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import useConfirmationDialog from './useConfirmationDialog';

const ConfirmationHarness = () => {
  const confirmation = useConfirmationDialog();

  return (
    <>
      <span>{confirmation.target?.name || 'No target'}</span>
      <button onClick={() => confirmation.openDialog({ name: 'Example Company' })}>Open</button>
      <button onClick={confirmation.closeDialog}>Close</button>
    </>
  );
};

test('clears the selected target when the dialog closes', () => {
  render(<ConfirmationHarness />);

  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
  expect(screen.getByText('Example Company')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.getByText('No target')).toBeTruthy();
});
