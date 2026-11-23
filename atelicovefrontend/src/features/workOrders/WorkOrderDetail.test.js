import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import { useAuth } from '../../Components/AuthContext';
import { workOrderService } from '../../services/workOrderService';
import WorkOrderDetail from './WorkOrderDetail';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ workOrderID: '11' }),
}));
jest.mock('../../Components/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../services/workOrderService', () => ({
  workOrderService: { getById: jest.fn() },
}));
jest.mock('../documents/WorkOrderDocuments', () => () => null);

test.each([
  [true, { project: { projectID: 7 } }, '/admin/projects/7'],
  [false, { projectID: 7 }, '/worker/projects/7/edit'],
])('opens the API-linked project after direct work-order navigation (admin: %s)', async (isAdmin, project, path) => {
  useAuth.mockReturnValue({ user: { isAdmin } });
  workOrderService.getById.mockResolvedValue({ workOrderID: 11, status: 'OPEN', ...project });
  mockNavigate.mockClear();

  render(<ThemeProvider theme={theme}><WorkOrderDetail /></ThemeProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Open Project Workspace' }));

  expect(workOrderService.getById).toHaveBeenCalledWith('11');
  expect(mockNavigate).toHaveBeenCalledWith(path);
});
