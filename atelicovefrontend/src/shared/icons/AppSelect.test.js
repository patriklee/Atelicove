import { fireEvent, render, screen } from '@testing-library/react';
import { FormControl, InputLabel, MenuItem } from '@mui/material';
import AppSelect from './AppSelect';

test('preserves MUI select labeling and option behavior', () => {
  render(
    <FormControl>
      <InputLabel id="status-label">Status</InputLabel>
      <AppSelect label="Status" labelId="status-label" value="OPEN">
        <MenuItem value="OPEN">Open</MenuItem>
        <MenuItem value="COMPLETE">Complete</MenuItem>
      </AppSelect>
    </FormControl>
  );

  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }));

  expect(screen.getByRole('option', { name: 'Complete' })).toBeTruthy();
});
