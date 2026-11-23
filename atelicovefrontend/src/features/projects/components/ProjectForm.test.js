import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import theme from '../../../theme';
import ProjectForm from './ProjectForm';

const renderForm = (overrides = {}) => {
  const props = {
    form: { projectID: '', projectName: '', description: '', budget: '', teamIDs: [] },
    teams: [{ teamID: 2, teamName: 'Installation' }],
    saving: false,
    onChange: jest.fn(),
    onReset: jest.fn(),
    onSubmit: jest.fn(event => event.preventDefault()),
    onCancel: jest.fn(),
    ...overrides,
  };
  render(<ThemeProvider theme={theme}><ProjectForm {...props} /></ThemeProvider>);
  return props;
};

test('creation retains templates, planning steps, suggestions, and readiness', () => {
  renderForm();

  expect(screen.getByRole('combobox', { name: 'Project template' })).toBeTruthy();
  expect(screen.getByRole('list', { name: 'Project planning sequence' })).toBeTruthy();
  expect(screen.getByRole('complementary', { name: 'Planning summary' })).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Site Preparation' })).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'Planning readiness 0 percent' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Review & Create' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Save Changes' })).toBeNull();
});

test('editing reuses project fields without creation UI and supports save and cancel', () => {
  const props = renderForm({
    mode: 'edit',
    form: { projectID: 42, projectName: 'Renovation', description: 'Office work', budget: 1200, teamIDs: [2] },
  });

  expect(screen.getByRole('textbox', { name: /Project Name/ }).value).toBe('Renovation');
  expect(screen.getByRole('textbox', { name: 'Description' }).value).toBe('Office work');
  expect(screen.getByRole('spinbutton', { name: 'Budget' }).value).toBe('1200');
  expect(screen.getByRole('combobox', { name: 'Assigned teams' }).textContent).toBe('Installation');
  expect(screen.queryByRole('combobox', { name: 'Project template' })).toBeNull();
  expect(screen.queryByRole('list', { name: 'Project planning sequence' })).toBeNull();
  expect(screen.queryByRole('complementary', { name: 'Planning summary' })).toBeNull();
  expect(screen.queryByText('Review & Create')).toBeNull();
  expect(screen.queryByText('Suggested Work Orders')).toBeNull();
  expect(screen.queryByText('Planning readiness')).toBeNull();

  fireEvent.change(screen.getByRole('textbox', { name: /Project Name/ }), { target: { value: 'Updated project' } });
  expect(props.onChange).toHaveBeenCalledWith({ projectName: 'Updated project' });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  expect(props.onSubmit).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(props.onCancel).toHaveBeenCalledTimes(1);
  expect(props.onSubmit).toHaveBeenCalledTimes(1);
});
