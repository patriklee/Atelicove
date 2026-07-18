import { apiFetch } from '../shared/api';
import { companyService } from './companyService';
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

// Edition-specific services are intentionally outside this shared contract suite.
