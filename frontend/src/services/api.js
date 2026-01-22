import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  signup: ({ username, password, role, firstName, lastName }) => 
    axios.post(`${API_BASE_URL}/auth/signup`, { username, password, role, firstName, lastName }, { withCredentials: true }),
  
  signin: (username, password) => 
    axios.post(`${API_BASE_URL}/auth/signin`, { username, password }, { withCredentials: true }),
};

export default api;
