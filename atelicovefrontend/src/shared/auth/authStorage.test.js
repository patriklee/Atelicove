import { clearStoredAuth, storeUser } from './authStorage';

beforeEach(() => {
  localStorage.clear();
});

test('stores the complete user and username under the existing keys', () => {
  const user = { username: 'plee', isAdmin: true, workerID: 7 };

  storeUser(user);

  expect(JSON.parse(localStorage.getItem('user'))).toEqual(user);
  expect(localStorage.getItem('username')).toBe('plee');
});

test('clears all existing authentication storage keys', () => {
  localStorage.setItem('user', '{}');
  localStorage.setItem('username', 'plee');
  localStorage.setItem('loggedInUser', 'plee');

  clearStoredAuth();

  expect(localStorage.getItem('user')).toBeNull();
  expect(localStorage.getItem('username')).toBeNull();
  expect(localStorage.getItem('loggedInUser')).toBeNull();
});
