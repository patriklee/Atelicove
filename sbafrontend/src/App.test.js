import { normalizeWorker, workerPayload } from './model';

test('normalizes the backend worker contract for the UI', () => {
  expect(normalizeWorker({
    workerID: 7,
    workerFName: 'Pat',
    workerLName: 'Smith',
    workerUser: 'psmith',
    workerEmail: 'psmith@example.test',
    admin: true,
    archived: true,
    archivedAt: '2026-06-25T12:00:00',
  })).toEqual({
    workerID: 7,
    firstName: 'Pat',
    lastName: 'Smith',
    username: 'psmith',
    email: 'psmith@example.test',
    isAdmin: true,
    archived: true,
    archivedAt: '2026-06-25T12:00:00',
  });
});

test('maps the UI worker form back to the backend contract', () => {
  expect(workerPayload({
    firstName: ' Pat ',
    lastName: ' Smith ',
    username: ' psmith ',
    email: ' psmith@example.test ',
    password: 'Password1',
    admin: false,
  })).toEqual({
    workerFName: 'Pat',
    workerLName: 'Smith',
    workerUser: 'psmith',
    workerEmail: 'psmith@example.test',
    workerPW: 'Password1',
    admin: false,
  });
});
