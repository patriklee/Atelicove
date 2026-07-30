import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import AdminSidebar from './AdminSidebar';

jest.mock('react-router-dom', () => {
  const ReactModule = jest.requireActual('react');
  return {
    Link: ReactModule.forwardRef(function MockLink(
      { children, state, to, ...props },
      ref
    ) {
      return ReactModule.createElement(
        'a',
        {
          ...props,
          'data-has-navigation-state': Boolean(state),
          href: to,
          ref,
        },
        children
      );
    }),
  };
});

const renderSidebar = (pathname = '/admin/projects/active', overrides = {}) => {
  const props = {
    mobile: false,
    mobileOpen: false,
    onClose: jest.fn(),
    onLogout: jest.fn(),
    pathname,
    user: {
      displayName: 'Patricia Morgan',
      firstName: 'Patricia',
      lastName: 'Morgan',
      isAdmin: true,
    },
    ...overrides,
  };

  render(
    <ThemeProvider theme={theme}>
      <AdminSidebar {...props} />
    </ThemeProvider>
  );

  return props;
};

test('expands the active project group and marks its current route', () => {
  renderSidebar();

  expect(screen.getByRole('button', { name: 'Projects' }).getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('link', { name: 'Project Studio' }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('link', { name: 'Project Studio' }).getAttribute('href')).toBe('/admin/projects/active');
});

test('keeps project group expansion keyboard-operable and manually collapsible', () => {
  renderSidebar();

  const projectsButton = screen.getByRole('button', { name: 'Projects' });
  fireEvent.click(projectsButton);

  expect(projectsButton.getAttribute('aria-expanded')).toBe('false');
});

test('keeps logout in the account area and delegates to existing logout flow', () => {
  const onLogout = jest.fn();
  renderSidebar('/admin', { onLogout });

  expect(screen.getByText('Patricia Morgan')).toBeTruthy();
  expect(screen.getByText('Administrator')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

  expect(onLogout).toHaveBeenCalledTimes(1);
});
