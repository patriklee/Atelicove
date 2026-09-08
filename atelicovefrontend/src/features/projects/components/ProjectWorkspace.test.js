import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import theme from '../../../theme';
import ProjectWorkspace from './ProjectWorkspace';

jest.mock('../../documents', () => ({
  WorkOrderDocuments: () => <div>Project Documents</div>,
}));

const baseProps = {
  project: {
    projectID: 42,
    projectStatus: 'OPEN',
    archived: false,
    workOrders: [],
    comments: [],
    actionItems: [],
  },
  canManage: true,
  workOrderForm: { existingWorkOrderID: '', teamID: '', companyID: '', comment: '' },
  workOrders: [],
  teams: [],
  companies: [],
  saving: false,
  commentText: '',
  commentType: 'GENERAL',
  actionItemText: '',
  onWorkOrderFormChange: jest.fn(),
  onOpenWorkOrder: jest.fn(),
  onRemoveWorkOrder: jest.fn(),
  onAttachWorkOrder: jest.fn(event => event.preventDefault()),
  onCommentTextChange: jest.fn(),
  onCommentTypeChange: jest.fn(),
  onAddComment: jest.fn(event => event.preventDefault()),
  onActionItemTextChange: jest.fn(),
  onToggleActionItem: jest.fn(),
  onAddActionItem: jest.fn(event => event.preventDefault()),
  onRunProjectAction: jest.fn(),
};

test('keeps project workflow sections and lifecycle actions in the project feature', () => {
  render(
    <ThemeProvider theme={theme}>
      <ProjectWorkspace {...baseProps} />
    </ThemeProvider>,
  );

  expect(screen.getByRole('heading', { name: 'Project Work Orders' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Comments' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Action Items' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Submit for Review' }));
  expect(baseProps.onRunProjectAction).toHaveBeenCalledWith(
    '/projects/42/submit',
    { method: 'PUT' },
    'Project submitted for review.',
  );
});
