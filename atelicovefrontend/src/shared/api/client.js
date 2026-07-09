import { mockApiFetch } from '../../mocks/mockApi';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const USE_MOCK_API = String(process.env.REACT_APP_USE_MOCK_API || '').toLowerCase() === 'true';

if (USE_MOCK_API) {
  console.info('[Atelicove API] Mock API mode is ON');
}

function buildUrl(path = '') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function normalizeOptions(options = {}) {
  const headers = new Headers(options.headers || {});
  const normalized = { ...options, headers };

  if (normalized.body && !(normalized.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return normalized;
}

export async function apiFetch(path, options = {}) {
  if (USE_MOCK_API) {
    return mockApiFetch(path, options);
  }

  const response = await fetch(buildUrl(path), normalizeOptions(options));
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = contentType.includes('application/json') ? await response.json() : await response.text();
      message = errorBody?.message || errorBody?.error || errorBody || message;
    } catch (error) {
      // Keep default message when error body cannot be parsed.
    }
    throw new Error(message);
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
    throw new Error(`Download failed with status ${response.status}`);
  }
  return response.blob();
}
