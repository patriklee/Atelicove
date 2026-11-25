import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../Components/AuthContext';
import { apiFetch } from '../../shared/api';
import theme from '../../theme';
import ProjectsPage from './ProjectsPage';

jest.mock('react-router-dom', () => ({
  Link: require('react').forwardRef(({ to, ...props }, ref) => <a ref={ref} href={to} {...props} />),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));
jest.mock('../../Components/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../shared/api', () => ({ apiFetch: jest.fn() }));
jest.mock('../documents', () => ({ WorkOrderDocuments: () => <div>Project Documents</div> }));

let navigate;
let projects;

beforeEach(() => {
  jest.clearAllMocks();
  navigate = jest.fn();
  useNavigate.mockReturnValue(navigate);
  useParams.mockReturnValue({});
  useAuth.mockReturnValue({ user: { isAdmin: true } });
  projects = [
    { projectID: 1, projectName: 'Alpha', projectStatus: 'OPEN' },
    { projectID: 2, projectName: 'Beta', projectStatus: 'OPEN', description: 'Office renovation' },
  ];
  apiFetch.mockImplementation(async (path, options) => {
    if (path === '/projects') return projects;
    if (path === '/projects/2/submit' && options?.method === 'PUT') {
      projects[1] = { ...projects[1], projectStatus: 'IN_REVIEW' };
      return projects[1];
    }
    return projects.find(project => path === `/projects/${project.projectID}`) || [];
  });
});

const renderPage = (props = {}) => render(
  <ThemeProvider theme={theme}><ProjectsPage {...props} /></ThemeProvider>,
);

test('shows only project details and preserves table sorting on close', async () => {
  renderPage();
  const button = await screen.findByRole('button', { name: 'Beta' });
  fireEvent.click(screen.getByRole('button', { name: /^Project/ }));
  const table = screen.getByRole('table');
  act(() => button.focus());
  fireEvent.click(button);
  const dialog = await screen.findByRole('dialog');
  expect(await within(dialog).findByText('Office renovation')).toBeTruthy();
  expect(within(dialog).getByText('Project ID')).toBeTruthy();
  expect(within(dialog).queryByRole('textbox')).toBeNull();
  expect(within(dialog).getAllByRole('button')).toHaveLength(1);
  expect(within(dialog).queryByText('Project Work Orders')).toBeNull();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.getByRole('table')).toBe(table);
  expect(screen.getByRole('columnheader', { name: /^Project/ }).getAttribute('aria-sort')).toBe('descending');
  expect(document.activeElement).toBe(button);
  expect(navigate).not.toHaveBeenCalled();
});

test.each(['Escape', 'backdrop'])('dismisses the workspace with %s', async (method) => {
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'Alpha' }));
  const dialog = await screen.findByRole('dialog');
  await within(dialog).findByRole('heading', { name: 'Alpha' });
  if (method === 'Escape') fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27 });
  else if (method === 'backdrop') {
    fireEvent.mouseDown(dialog.parentElement);
    fireEvent.click(dialog.parentElement);
  }
  else fireEvent.click(within(dialog).getByRole('button', { name: 'Active Projects' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.getByRole('button', { name: 'Alpha' })).toBeTruthy();
  expect(navigate).not.toHaveBeenCalled();
});

test('keeps the standalone workspace and its permission gates available', async () => {
  useParams.mockReturnValue({ projectID: '2' });
  useAuth.mockReturnValue({ user: { isAdmin: false } });
  renderPage({ mode: 'workspace' });
  expect(await screen.findByRole('heading', { name: 'Beta' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Comments' })).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByRole('link', { name: 'Edit Project' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Submit for Review' })).toBeNull();
  expect(screen.queryByRole('textbox', { name: 'Comment' })).toBeNull();
});

test('provides workspace modification controls on the Edit Project page', async () => {
  useParams.mockReturnValue({ projectID: '2' });
  renderPage({ mode: 'edit' });
  expect(await screen.findByRole('heading', { name: 'Edit Project' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Submit for Review' })).toBeTruthy();
  expect(screen.getByRole('textbox', { name: 'Comment' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeTruthy();
});
