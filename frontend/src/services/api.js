import axios from 'axios';

// Create Axios instance with API prefix
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Registered by AuthContext so a 401 can clear in-memory auth state, not just localStorage
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

// Response interceptor: Standardize errors and handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper service functions
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const pollService = {
  getAll: (params) => api.get('/polls', { params }),
  getById: (id) => api.get(`/polls/${id}`),
  create: (data) => api.post('/polls', data),
  update: (id, data) => api.put(`/polls/${id}`, data),
  close: (id) => api.patch(`/polls/${id}/close`),
  delete: (id) => api.delete(`/polls/${id}`),
  castVote: (id, optionId) => api.post(`/polls/${id}/vote`, { optionId }),
  getMyVote: (id) => api.get(`/polls/${id}/my-vote`),
  getResults: (id) => api.get(`/polls/${id}/results`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;
