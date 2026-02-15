import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production backend URL
const API_URL = 'https://my-sports-app-testing.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('AsyncStorage error:', err);
    }
    console.log('API Request:', config.url, config.method);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response error logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data, error.message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (email, password, fullName, phoneNumber) =>
    api.post('/auth/signup', { email, password, full_name: fullName, phone_number: phoneNumber }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, token, newPassword) =>
    api.post('/auth/reset-password', { email, token, new_password: newPassword }),
};

export const venueAPI = {
  list: () => api.get('/venues'),
  get: (id) => api.get(`/venues/${id}`),
};

export const sessionAPI = {
  list: (page = 1, limit = 10, status = 'open', date = null, location = null) => {
    const params = { page, limit, status };
    if (date) params.date = date;
    if (location) params.location = location;
    return api.get('/sessions', { params });
  },
  get: (id) => api.get(`/sessions/${id}`),
  getByCode: (code) => api.get(`/sessions/${code}`),
  create: (title, description, locationAddress, scheduledDate, scheduledTime, totalCost, maxParticipants = 14, scheduledEndTime = null, sportType = null, venueId = null) =>
    api.post('/sessions', {
      title,
      description,
      location_address: locationAddress,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      scheduled_end_time: scheduledEndTime,
      total_cost: totalCost,
      max_participants: maxParticipants,
      sport_type: sportType,
      venue_id: venueId,
    }),
  join: (id) => api.post(`/sessions/${id}/join`),
  leave: (id) => api.delete(`/sessions/${id}/leave`),
  cancel: (id) => api.delete(`/sessions/${id}`),
  getParticipants: (id) => api.get(`/sessions/${id}/participants`),
};

export default api;
