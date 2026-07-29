import { fireEvent, render, screen } from '@testing-library/react';
import AppIconButton from './AppIconButton';
import icons from './iconMap';

test('provides an accessible label while keeping its icon decorative', () => {
  const onClick = jest.fn();
  render(
    <AppIconButton
      icon={icons.menu}
      iconProps={{ 'data-testid': 'button-icon' }}
      label="Open navigation"
      onClick={onClick}
    />
  );

  const button = screen.getByRole('button', { name: 'Open navigation' });
  fireEvent.click(button);

  expect(onClick).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('button-icon').getAttribute('aria-hidden')).toBe('true');
});

test('preserves the disabled button state', () => {
  render(<AppIconButton disabled icon={icons.delete} label="Delete item" />);

  expect(screen.getByRole('button', { name: 'Delete item' }).disabled).toBe(true);
});
