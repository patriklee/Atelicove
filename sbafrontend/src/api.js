import { mockApiFetch } from './mockApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiFetch = async (path, options = {}) => {
  if (USE_MOCK_API) {
    return mockApiFetch(path, options);
  }

  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const data = response.status === 204
    ? null
    : contentType.includes('application/json')
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    const message = data?.message || data || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
};
