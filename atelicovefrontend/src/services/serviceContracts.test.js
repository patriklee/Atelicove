import { apiFetch } from '../shared/api';
import { companyService } from './companyService';
import { draftService } from './draftService';
import { workerService } from './workerService';
import { workOrderService } from './workOrderService';

jest.mock('../shared/api', () => ({ apiFetch: jest.fn(), apiDownload: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

test('company service uses the existing company controller routes', async () => {
  await companyService.create({ companyName: 'Example' });
  await companyService.archive(3);
  await companyService.restore(3);

  expect(apiFetch).toHaveBeenNthCalledWith(1, '/companies/add', expect.objectContaining({ method: 'POST' }));
  expect(apiFetch).toHaveBeenNthCalledWith(2, '/companies/3', { method: 'DELETE' });
  expect(apiFetch).toHaveBeenNthCalledWith(3, '/companies/3/restore', { method: 'PUT' });
});

test('worker and work-order services use targeted controller routes', async () => {
  await workerService.archive(4);
  await workerService.restore(4);
  await workOrderService.addWorker(9, 4);

  expect(apiFetch).toHaveBeenNthCalledWith(1, '/workers/4', { method: 'DELETE' });
  expect(apiFetch).toHaveBeenNthCalledWith(2, '/workers/4/restore', { method: 'PUT' });
  expect(apiFetch).toHaveBeenNthCalledWith(3, '/workorders/9/assign', {
    method: 'PUT',
    body: JSON.stringify({ workerID: 4 }),
  });
});

test('draft service uses the dedicated draft-project routes', async () => {
  await draftService.getDrafts();
  await draftService.create({ draftName: 'Plan' });
  await draftService.createWorkOrder(7, { comment: 'Inspect' });
  await draftService.createPlannedStaffing(7, { staffingName: 'Crew' });
  await draftService.archive(7);

  expect(apiFetch).toHaveBeenNthCalledWith(1, '/draft-projects');
  expect(apiFetch).toHaveBeenNthCalledWith(2, '/draft-projects', expect.objectContaining({ method: 'POST' }));
  expect(apiFetch).toHaveBeenNthCalledWith(3, '/draft-projects/7/work-orders', expect.objectContaining({ method: 'POST' }));
  expect(apiFetch).toHaveBeenNthCalledWith(4, '/draft-projects/7/planned-staffing', expect.objectContaining({ method: 'POST' }));
  expect(apiFetch).toHaveBeenNthCalledWith(5, '/draft-projects/7', { method: 'DELETE' });
});
