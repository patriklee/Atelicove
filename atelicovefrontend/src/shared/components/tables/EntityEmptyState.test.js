import React from 'react';
import { render, screen } from '@testing-library/react';
import EntityEmptyState from './EntityEmptyState';

test('renders the existing empty message with the requested column span', () => {
  render(
    <table>
      <tbody>
        <EntityEmptyState message="No companies found." colSpan={4} />
      </tbody>
    </table>
  );

  expect(screen.getByRole('cell', { name: 'No companies found.' }).colSpan).toBe(4);
});
