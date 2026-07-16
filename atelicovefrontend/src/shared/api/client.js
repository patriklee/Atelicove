import { mockApiFetch } from '../../mocks/mockApi';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const USE_MOCK_API = String(process.env.REACT_APP_USE_MOCK_API || '').toLowerCase() === 'true';
export const AUTH_UNAUTHORIZED_EVENT = 'atelicove:auth-unauthorized';

if (USE_MOCK_API) {
  console.info('[Atelicove API] Mock API mode is ON');
}

function buildUrl(path = '') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function normalizeOptions(options = {}) {
  const headers = new Headers(options.headers || {});
  const normalized = { credentials: 'include', ...options, headers };

  if (normalized.body && !(normalized.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return normalized;
}

function clearLocalAuthState() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('user');
  localStorage.removeItem('username');
  localStorage.removeItem('loggedInUser');
}

function notifyUnauthorized() {
  clearLocalAuthState();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  }
}

async function responseError(response, fallbackPrefix = 'Request failed with status') {
  const contentType = response.headers.get('content-type') || '';
  let message = `${fallbackPrefix} ${response.status}`;

  try {
    const errorBody = contentType.includes('application/json') ? await response.json() : await response.text();
    message = errorBody?.message || errorBody?.error || errorBody || message;
  } catch (error) {
    // Keep the status-based message when the error body cannot be parsed.
  }

  if (response.status === 401) {
    notifyUnauthorized();
  }

  const error = new Error(message);
  error.status = response.status;
  return error;
}

export async function apiFetch(path, options = {}) {
  if (USE_MOCK_API) {
    try {
      return await mockApiFetch(path, options);
    } catch (error) {
      if (error.status === 401) notifyUnauthorized();
      throw error;
    }
  }

  const response = await fetch(buildUrl(path), normalizeOptions(options));
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    throw await responseError(response);
  }

  if (response.status === 204) return null;
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

export async function apiDownload(path, options = {}) {
  if (USE_MOCK_API) {
    return new Blob(['Mock download'], { type: 'text/plain' });
  }

  const response = await fetch(buildUrl(path), normalizeOptions(options));
  if (!response.ok) {
    throw await responseError(response, 'Download failed with status');
  }
  return response.blob();
}
