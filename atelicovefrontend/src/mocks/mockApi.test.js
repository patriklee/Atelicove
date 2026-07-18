import { mockApiFetch, resetMockApiState } from './mockApi';

const login = (username = 'patricia', password = 'Admin@123') => mockApiFetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username, password }),
});

beforeEach(() => {
  localStorage.clear();
  resetMockApiState();
});

test('mock authentication returns the canonical backend login shape', async () => {
  const response = await login();
  expect(response).toMatchObject({ workerID: 1, workerUser: 'patricia', workerFName: 'Patricia', admin: true });
  expect(response).not.toHaveProperty('password');
  expect(response).not.toHaveProperty('workerPW');
  expect(response).not.toHaveProperty('username');
  expect(response).not.toHaveProperty('isAdmin');
  await expect(mockApiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'patricia', password: 'wrong' }) }))
    .rejects.toMatchObject({ status: 401 });
  await expect(mockApiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username: '', password: '' }) }))
    .rejects.toMatchObject({ status: 400 });
});

test('active and archived project routes are separated and use backend statuses', async () => {
  await login();
  const active = await mockApiFetch('/projects');
  const archived = await mockApiFetch('/projects/archived');
  expect(active.every(project => !project.archived)).toBe(true);
  expect(archived.every(project => project.archived)).toBe(true);
  expect([...active, ...archived].every(project => ['OPEN', 'IN_REVIEW', 'COMPLETE'].includes(project.projectStatus))).toBe(true);
  expect(active[0]).not.toHaveProperty('id');
  expect(active[0].teams[0].workers[0]).not.toHaveProperty('workerPW');
});

test('worker project queries only return assigned projects', async () => {
  await login('mcarter', 'Worker@123');
  const projects = await mockApiFetch('/projects');
  expect(projects.length).toBeGreaterThan(0);
  expect(projects.every(project =>
    project.teams.some(team => team.workers.some(worker => worker.workerID === 2)) ||
    project.workOrders.some(order => order.workers.some(worker => worker.workerID === 2))
  )).toBe(true);
  await expect(mockApiFetch('/projects/301', {
    method: 'PUT',
    body: JSON.stringify({ projectName: 'Unauthorized change' }),
  })).rejects.toMatchObject({ status: 403 });
});

test('work-order lifecycle uses IN_PROCESS and seals completed records', async () => {
  await login();
  const started = await mockApiFetch('/workorders/1002/start', { method: 'PUT' });
  expect(started.status).toBe('IN_PROCESS');
  const workOrders = await mockApiFetch('/workorders/all-with-archived');
  expect(workOrders.some(order => order.status === 'ACTIVE')).toBe(false);
  await expect(mockApiFetch('/workorders/1007/comment', {
    method: 'PUT',
    body: JSON.stringify({ comment: 'should fail' }),
  })).rejects.toMatchObject({ status: 409 });
});

test('document validation enforces backend type and MIME/extension contracts', async () => {
  await login();
  const body = new FormData();
  body.append('file', new File(['data'], 'report.pdf', { type: 'text/plain' }));
  body.append('documentType', 'WORK_ORDER');
  await expect(mockApiFetch('/workorders/1002/documents', { method: 'POST', body }))
    .rejects.toMatchObject({ status: 400 });
});
