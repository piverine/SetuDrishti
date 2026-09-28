/**
 * Wrapper around fetch that automatically includes Clerk JWT token
 * Falls back to demo token if no Clerk token available
 */
export async function apiCall(url, options = {}, token = null) {
  // Use provided token or fallback to demo token
  const authToken = token || 'simulator_dev_token';

  // Merge headers with authorization
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${authToken}`
  };

  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Typed wrapper for JSON responses
 */
export async function apiCallJson(url, options = {}, token = null) {
  const response = await apiCall(url, options, token);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

