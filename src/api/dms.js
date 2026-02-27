import client from './client';

const BASE = '/api/dms';

export const documentTypesApi = {
  list: () => client.get(`${BASE}/types`),
  create: (data) => client.post(`${BASE}/types`, data),
  update: (id, data) => client.put(`${BASE}/types/${id}`, data),
  delete: (id) => client.delete(`${BASE}/types/${id}`),
};

export const documentStatusesApi = {
  list: () => client.get(`${BASE}/statuses`),
  create: (data) => client.post(`${BASE}/statuses`, data),
  update: (id, data) => client.put(`${BASE}/statuses/${id}`, data),
  delete: (id) => client.delete(`${BASE}/statuses/${id}`),
};

export const documentsApi = {
  list: () => client.get(`${BASE}/documents`),
  get: (id) => client.get(`${BASE}/documents/${id}`),
  create: (data) => client.post(`${BASE}/documents`, data),
  update: (id, data) => client.put(`${BASE}/documents/${id}`, data),
  delete: (id) => client.delete(`${BASE}/documents/${id}`),
  upload: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post(`${BASE}/documents/${id}/upload`, fd);
  },
  downloadUrl: (id) => `http://localhost:8080/api/dms/documents/${id}/download`,
};

export const distributionsApi = {
  list: () => client.get(`${BASE}/distributions`),
  get: (id) => client.get(`${BASE}/distributions/${id}`),
  create: (data) => client.post(`${BASE}/distributions`, data),
  delete: (id) => client.delete(`${BASE}/distributions/${id}`),
};
