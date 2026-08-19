/**
 * Centralized API Client for Restaurant OS
 *
 * - Always uses credentials: 'include' to send the HttpOnly session cookie
 * - Parses the standard response envelope { success, data, error, message, meta }
 * - Handles 401 → dispatches session expiry event for auth slice to catch
 * - Never stores or returns the session token
 */

const BASE_URL = '/api/v1';

/**
 * Core fetch wrapper. All requests go through this.
 */
async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  const mergedOptions = { ...defaultOptions, ...options, headers: defaultOptions.headers };

  let response;
  try {
    response = await fetch(url, mergedOptions);
  } catch (networkError) {
    // Network failure — server unreachable
    throw {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the server. Please check your connection.',
      status: 0,
    };
  }

  // 204 No Content — no body to parse
  if (response.status === 204) {
    return { success: true, data: null, message: null, meta: null };
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw {
      code: 'PARSE_ERROR',
      message: 'Unexpected server response.',
      status: response.status,
    };
  }

  if (!response.ok) {
    const error = body?.error || {};

    if (response.status === 401) {
      // Broadcast session expiry so auth slice can react
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }

    throw {
      code: error.code || `HTTP_${response.status}`,
      message: error.message || _defaultMessage(response.status),
      details: error.details || {},
      status: response.status,
    };
  }

  return body;
}

function _defaultMessage(status) {
  switch (status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Your session has expired. Please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 422: return 'Validation failed. Please check your input.';
    case 429: return 'Too many requests. Please slow down and try again.';
    case 500: return 'An unexpected server error occurred. Please try again later.';
    default:  return 'Something went wrong. Please try again.';
  }
}

/**
 * Public API methods
 */
export const api = {
  get: (path, options = {}) =>
    apiFetch(path, { ...options, method: 'GET' }),

  post: (path, body, options = {}) =>
    apiFetch(path, { ...options, method: 'POST', body: JSON.stringify(body) }),

  put: (path, body, options = {}) =>
    apiFetch(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  patch: (path, body, options = {}) =>
    apiFetch(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: (path, options = {}) =>
    apiFetch(path, { ...options, method: 'DELETE' }),
};
