import { apiFetch, AUTH_UNAUTHORIZED_EVENT } from './client';

const response = ({ ok, status, body, contentType = 'application/json' }) => ({
  ok,
  status,
  headers: { get: () => contentType },
  json: async () => body,
  text: async () => typeof body === 'string' ? body : JSON.stringify(body),
});

beforeEach(() => {
  global.fetch = jest.fn();
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('includes the server session cookie on API requests', async () => {
  fetch.mockResolvedValue(response({ ok: true, status: 200, body: { value: 1 } }));

  await expect(apiFetch('/auth/me')).resolves.toEqual({ value: 1 });
  expect(fetch).toHaveBeenCalledWith(
    'http://localhost:8080/auth/me',
    expect.objectContaining({ credentials: 'include' })
  );
});

test('adds the readable CSRF cookie to state-changing request headers', async () => {
  document.cookie = 'XSRF-TOKEN=csrf-token-value';
  fetch.mockResolvedValue(response({ ok: true, status: 204, body: null, contentType: '' }));

  await apiFetch('/auth/logout', { method: 'POST' });

  const requestOptions = fetch.mock.calls[0][1];
  expect(requestOptions.credentials).toBe('include');
  expect(requestOptions.headers.get('X-XSRF-TOKEN')).toBe('csrf-token-value');
});

test('does not add a CSRF header to safe requests', async () => {
  document.cookie = 'XSRF-TOKEN=csrf-token-value';
  fetch.mockResolvedValue(response({ ok: true, status: 200, body: { value: 1 } }));

  await apiFetch('/auth/me');

  expect(fetch.mock.calls[0][1].headers.has('X-XSRF-TOKEN')).toBe(false);
});

test('clears cached auth and emits an event on unauthorized responses', async () => {
  localStorage.setItem('user', '{"username":"plee"}');
  localStorage.setItem('username', 'plee');
  const listener = jest.fn();
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
  fetch.mockResolvedValue(response({ ok: false, status: 401, body: { message: 'Unauthorized' } }));

  await expect(apiFetch('/projects')).rejects.toMatchObject({ message: 'Unauthorized', status: 401 });
  expect(localStorage.getItem('user')).toBeNull();
  expect(localStorage.getItem('username')).toBeNull();
  expect(listener).toHaveBeenCalledTimes(1);

  window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
});
