import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../../theme';
import ProjectList from './ProjectList';

const projects = [
  { projectID: 1, projectName: 'Alpha', projectStatus: 'OPEN', budget: 100, lastModifiedAt: '2026-01-01', teams: [{ teamID: 4, teamName: 'Electrical' }] },
  { projectID: 2, projectName: 'Beta', projectStatus: 'IN_REVIEW', budget: 500, lastModifiedAt: '2026-02-01' },
  { projectID: 3, projectName: 'Archived project', projectStatus: 'COMPLETE', archived: true },
];

const renderList = (overrides = {}) => {
  const props = { projects, canManage: true, onOpen: jest.fn(), onEdit: jest.fn(), ...overrides };
  render(<ThemeProvider theme={theme}><ProjectList {...props} /></ThemeProvider>);
  return props;
};

test('filters loaded active projects by search and status without showing archives', () => {
  renderList();
  expect(screen.queryByText('Archived project')).toBeNull();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search projects' }), { target: { value: 'electrical' } });
  expect(screen.getByText('Alpha')).toBeTruthy();
  expect(screen.queryByText('Beta')).toBeNull();

  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }));
  fireEvent.click(screen.getByRole('option', { name: 'Needs Review' }));
  expect(screen.getByText('No projects match your search and filters.')).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search projects' }), { target: { value: '' } });
  expect(screen.getByText('Beta')).toBeTruthy();
  expect(screen.queryByText('Alpha')).toBeNull();
});

test('sorts loaded projects and exposes direct workspace and edit actions', () => {
  const props = renderList();
  expect(within(screen.getAllByRole('row')[1]).getByText('Beta')).toBeTruthy();
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sort by' }));
  fireEvent.click(screen.getByRole('option', { name: 'Name A–Z' }));
  const firstRow = within(screen.getAllByRole('row')[1]);
  expect(firstRow.getByText('Alpha')).toBeTruthy();
  fireEvent.click(firstRow.getByRole('button', { name: 'Open Workspace' }));
  fireEvent.click(firstRow.getByRole('button', { name: 'Edit Project' }));
  expect(props.onOpen).toHaveBeenCalledWith(projects[0]);
  expect(props.onEdit).toHaveBeenCalledWith(projects[0]);
  expect(projects.map(project => project.projectID)).toEqual([1, 2, 3]);
});

test('keeps configuration editing unavailable without management permission', () => {
  renderList({ canManage: false });
  expect(screen.getAllByRole('button', { name: 'Open Workspace' })).toHaveLength(2);
  expect(screen.queryByRole('button', { name: 'Edit Project' })).toBeNull();
});
