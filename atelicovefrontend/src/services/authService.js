import { apiFetch } from '../shared/api';

export const authService = {
  login: (credentials) => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),
};
