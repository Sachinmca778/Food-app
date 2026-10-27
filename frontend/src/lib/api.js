/**
 * API Client Helper for Restaurant Direct Ordering SaaS
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Add staff token if present in localStorage (client-side only)
  if (typeof window !== 'undefined') {
    const staffToken = localStorage.getItem('staff_token');
    const customerToken = localStorage.getItem('customer_token');
    if (staffToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${staffToken}`;
    } else if (customerToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${customerToken}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export { API_BASE_URL };
