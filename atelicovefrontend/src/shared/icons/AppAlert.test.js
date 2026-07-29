import { render, screen } from '@testing-library/react';
import AppAlert from './AppAlert';

test('renders an accessible alert with the shared severity icon mapping', () => {
  render(<AppAlert severity="warning">Review this record.</AppAlert>);

  expect(screen.getByRole('alert').textContent).toContain('Review this record.');
});
