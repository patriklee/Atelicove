import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import StartupSplash from './StartupSplash';
import theme from '../theme';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('progresses from preparation to launch and completes at 2.4 seconds', () => {
  const onComplete = jest.fn();
  render(
    <ThemeProvider theme={theme}>
      <StartupSplash onComplete={onComplete} />
    </ThemeProvider>
  );

  expect(screen.getByText('Preparing workspace…')).toBeTruthy();
  expect(screen.getByText('ATELICOVE')).toBeTruthy();

  act(() => jest.advanceTimersByTime(1900));
  expect(screen.getByText('Launching…')).toBeTruthy();
  expect(onComplete).not.toHaveBeenCalled();

  act(() => jest.advanceTimersByTime(500));
  expect(onComplete).toHaveBeenCalledTimes(1);
});
