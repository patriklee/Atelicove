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

test('shows active projects without search or selectable filters and keeps project actions', () => {
  const props = renderList();
  expect(screen.queryByText('Archived project')).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByRole('combobox')).toBeNull();
  const firstRow = within(screen.getAllByRole('row')[1]);
  expect(firstRow.getByText('Beta')).toBeTruthy();
  fireEvent.click(firstRow.getByRole('button', { name: 'Open Workspace' }));
  fireEvent.click(firstRow.getByRole('button', { name: 'Edit Project' }));
  expect(props.onOpen).toHaveBeenCalledWith(projects[1]);
  expect(props.onEdit).toHaveBeenCalledWith(projects[1]);
});

test('keeps configuration editing unavailable without management permission', () => {
  renderList({ canManage: false });
  expect(screen.getAllByRole('button', { name: 'Open Workspace' })).toHaveLength(2);
  expect(screen.queryByRole('button', { name: 'Edit Project' })).toBeNull();
});
