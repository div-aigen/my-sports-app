import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: (email, password, fullName, phoneNumber) =>
    api.post('/auth/signup', { email, password, full_name: fullName, phone_number: phoneNumber }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, token, newPassword) =>
    api.post('/auth/reset-password', { email, token, new_password: newPassword }),
};

export const sessionAPI = {
  list: (page = 1, limit = 10, status = 'open', date = null, location = null) =>
    api.get('/sessions', { params: { page, limit, status, date, location } }),
  get: (id) => api.get(`/sessions/${id}`),
  create: (title, description, locationAddress, scheduledDate, scheduledTime, totalCost) =>
    api.post('/sessions', {
      title,
      description,
      location_address: locationAddress,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      total_cost: totalCost,
    }),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  cancel: (id) => api.delete(`/sessions/${id}`),
  join: (id) => api.post(`/sessions/${id}/join`),
  leave: (id) => api.delete(`/sessions/${id}/leave`),
  getParticipants: (id) => api.get(`/sessions/${id}/participants`),
};

export const venueAPI = {
  list: () => api.get('/venues'),
};

export const userAPI = {
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export default api;
