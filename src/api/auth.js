import axios from 'axios';

const BASE = 'http://localhost:8080/api/auth';

export const authApi = {
  login: (username, password) =>
    axios.post(`${BASE}/login`, { username, password }),
  refresh: (refresh) =>
    axios.post(`${BASE}/refresh`, { refresh }),
};
