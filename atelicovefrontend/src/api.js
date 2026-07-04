import { mockApiDownload, mockApiFetch } from './mockApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true' ||
  (process.env.NODE_ENV === 'development' &&
    process.env.REACT_APP_USE_MOCK_API !== 'false' &&
    !process.env.REACT_APP_API_URL);
const CAN_FALL_BACK_TO_MOCK = process.env.NODE_ENV === 'development';

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

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    if (CAN_FALL_BACK_TO_MOCK) {
      return mockApiFetch(path, options);
    }
    throw error;
  }

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

export const apiDownload = async (path) => {
  if (USE_MOCK_API) {
    return mockApiDownload(path);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
    });
  } catch (error) {
    if (CAN_FALL_BACK_TO_MOCK) {
      return mockApiDownload(path);
    }
    throw error;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Request failed (${response.status})`, response.status, message);
  }

  return response.blob();
};
