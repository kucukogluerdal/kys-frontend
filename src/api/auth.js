import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://kys-backend-production.up.railway.app';
const BASE = `${API_BASE}/api/auth`;

export const authApi = {
  login: (username, password) =>
    axios.post(`${BASE}/login`, { username, password }),
  refresh: (refresh) =>
    axios.post(`${BASE}/refresh`, { refresh }),
};
