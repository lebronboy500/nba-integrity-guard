import axios from 'axios';
import { Trade, Stats } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  health: () => api.get('/health'),

  // Stats
  getStats: () => api.get<Stats>('/stats'),

  // Trades
  getTrades: (limit = 50) => api.get<Trade[]>(`/trades?limit=${limit}`),

  createTrade: (data: { gameId: string; riggingIndex: number; anomalyScore: number }) =>
    api.post<{ trade: Trade }>('/signal', data),

  // Distribution
  executeDistribution: (profit: number) =>
    api.post('/distribution', { profit })
};

export default api;
