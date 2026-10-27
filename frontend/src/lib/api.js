/**
 * API Client Helper for Restaurant Direct Ordering SaaS
 */
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const API_BASE_URL = rawApiUrl.trim().replace(/\/+$/, '');

export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Smart role-based token attachment (client-side only)
  if (typeof window !== 'undefined' && !headers['Authorization']) {
    const isStaffRoute = endpoint.startsWith('/dashboard') || endpoint.startsWith('/admin');
    const staffToken = localStorage.getItem('staff_token') || localStorage.getItem('super_admin_token');
    const customerToken = localStorage.getItem('customer_token');

    if (isStaffRoute) {
      if (staffToken) headers['Authorization'] = `Bearer ${staffToken}`;
    } else {
      if (customerToken) {
        headers['Authorization'] = `Bearer ${customerToken}`;
      }
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
