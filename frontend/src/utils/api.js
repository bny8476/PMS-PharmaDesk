import axios from 'axios';
import toast from 'react-hot-toast';

// Ensure baseURL always ends with '/api' to match the Spring Boot backend
let base = import.meta.env.VITE_API_URL;

// Sanitize placeholder strings or missing env values to '/api'
if (!base || base.trim() === '' || base.includes('API_URL') || base.includes('undefined') || base.includes('[API_URL]')) {
  base = '/api';
} else {
  base = base.trim();
}

// For local development with Vite proxy, strip out absolute URL to prevent cross-origin cookie rejection
if (base.startsWith('http://localhost') || base.startsWith('http://127.0.0.1')) {
  base = '/api';
}

if (base && base !== '/api' && !base.endsWith('/api')) {
  base = base.endsWith('/') ? `${base}api` : `${base}/api`;
}

const api = axios.create({
  baseURL: base,
  withCredentials: true,
});

// Request interceptor – attach token and ensure /api prefix
api.interceptors.request.use(
  (config) => {
    // VITE_API_URL already contains '/api', so we do not need to prepend it again.

    // Try to attach token from localStorage as fallback if HttpOnly cookies fail (e.g. cross-origin dev)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const activeRole = localStorage.getItem('activeRole');
    if (activeRole) {
      config.headers['X-Active-Role'] = activeRole;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401/403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ignore 401s from the login endpoint so the UI can display the error
      if (error.config && !error.config.url.includes('/auth/login')) {
        // Token expired — clear and redirect to login
        localStorage.clear();
        window.dispatchEvent(new Event('auth:expired'));
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    if (error.response?.status === 403) {
      console.error('403 Forbidden:', error.config?.url,
        '| Check: 1) token sent? 2) role allowed in SecurityConfig?');
    }
    return Promise.reject(error);
  }
);

export default api;

export const fetchWithRetry = async (url, options = {}, retries = 2) => {
  let attempt = 0;
  const delays = [500, 1000];

  while (attempt <= retries) {
    try {
      const response = await api({ url, ...options });
      return response;
    } catch (error) {
      if (attempt === retries || (error.response && error.response.status !== 429 && (error.response.status >= 400))) {
        throw error;
      }
      console.warn(`Fetch failed (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delays[attempt]}ms...`);
      await new Promise(res => setTimeout(res, delays[attempt] || 1000));
      attempt++;
    }
  }
};
