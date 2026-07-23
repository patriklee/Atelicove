import { mockApiFetch } from '../../mocks/mockApi';
import { clearStoredAuth } from '../auth';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const USE_MOCK_API = String(process.env.REACT_APP_USE_MOCK_API || '').toLowerCase() === 'true';
export const AUTH_UNAUTHORIZED_EVENT = 'atelicove:auth-unauthorized';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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
  const method = String(normalized.method || 'GET').toUpperCase();

  if (STATE_CHANGING_METHODS.has(method) && !headers.has(CSRF_HEADER_NAME)) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) headers.set(CSRF_HEADER_NAME, csrfToken);
  }

  if (normalized.body && !(normalized.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return normalized;
}

function readCookie(name) {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const prefix = `${name}=`;
  const match = document.cookie.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith(prefix));
  return match ? decodeURIComponent(match.substring(prefix.length)) : null;
}

function notifyUnauthorized() {
  clearStoredAuth();
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
