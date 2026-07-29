import { render, screen } from '@testing-library/react';
import { Search } from 'iconoir-react';
import AppIcon, { DEFAULT_ICON_STROKE_WIDTH, ICON_SIZES } from './AppIcon';

test('renders decorative icons with shared visual defaults', () => {
  render(<AppIcon data-testid="decorative-icon" icon={Search} />);
  const icon = screen.getByTestId('decorative-icon');

  expect(icon.getAttribute('aria-hidden')).toBe('true');
  expect(icon.getAttribute('color')).toBe('currentColor');
  expect(icon.getAttribute('height')).toBe(String(ICON_SIZES.standard));
  expect(icon.getAttribute('width')).toBe(String(ICON_SIZES.standard));
  expect(icon.getAttribute('stroke-width')).toBe(String(DEFAULT_ICON_STROKE_WIDTH));
});

test('supports accessible standalone icons and contextual sizing', () => {
  render(
    <AppIcon
      className="status-icon"
      icon={Search}
      label="Search status"
      size={ICON_SIZES.large}
      strokeWidth={2}
    />
  );

  const icon = screen.getByRole('img', { name: 'Search status' });
  expect(icon.getAttribute('aria-hidden')).toBe(null);
  expect(icon.getAttribute('class')).toContain('status-icon');
  expect(icon.getAttribute('height')).toBe(String(ICON_SIZES.large));
  expect(icon.getAttribute('stroke-width')).toBe('2');
});
