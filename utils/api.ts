import axios from 'axios';

// Configure API base URL
// In development, use your local server
// In production, use your deployed server URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-server.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Health check
  health: () => api.get('/health'),

  // Memories
  getMemories: () => api.get('/memories'),
  createMemory: (formData: FormData) => 
    api.post('/memories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteMemory: (id: string) => api.delete(`/memories/${id}`),

  // Reminders
  getReminders: () => api.get('/reminders'),
  createReminder: (data: any) => api.post('/reminders', data),
  updateReminder: (id: string, data: any) => api.put(`/reminders/${id}`, data),
  deleteReminder: (id: string) => api.delete(`/reminders/${id}`),

  // Chat
  getChatHistory: () => api.get('/chat/history'),
  sendMessage: (message: string) => api.post('/chat/message', { message }),

  // Emergency Contacts
  getEmergencyContacts: () => api.get('/emergency-contacts'),
  createEmergencyContact: (data: any) => api.post('/emergency-contacts', data),
  updateEmergencyContact: (id: string, data: any) => api.put(`/emergency-contacts/${id}`, data),
  deleteEmergencyContact: (id: string) => api.delete(`/emergency-contacts/${id}`),

  // SOS
  triggerSOSAlert: (data: any) => api.post('/sos/alert', data),
};

export default api;