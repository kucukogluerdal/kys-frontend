import client from './client';

const BASE = '/api/organization';

export const unitsApi = {
  list: () => client.get(`${BASE}/units`),
  get: (id) => client.get(`${BASE}/units/${id}`),
  detail: (id) => client.get(`${BASE}/units/${id}/detail`),
  create: (data) => client.post(`${BASE}/units`, data),
  update: (id, data) => client.put(`${BASE}/units/${id}`, data),
  delete: (id) => client.delete(`${BASE}/units/${id}`),
  assignPositions: (unitId, positionIds) => client.post(`${BASE}/units/${unitId}/positions`, { positionIds }),
  removePosition: (unitId, positionId) => client.delete(`${BASE}/units/${unitId}/positions/${positionId}`),
  addChild: (parentId, childId) => client.post(`${BASE}/units/${parentId}/children/${childId}`),
  removeChild: (parentId, childId) => client.delete(`${BASE}/units/${parentId}/children/${childId}`),
};

export const rolesApi = {
  list: () => client.get(`${BASE}/roles`),
  get: (id) => client.get(`${BASE}/roles/${id}`),
  create: (data) => client.post(`${BASE}/roles`, data),
  update: (id, data) => client.put(`${BASE}/roles/${id}`, data),
  delete: (id) => client.delete(`${BASE}/roles/${id}`),
};

export const titlesApi = {
  list: () => client.get(`${BASE}/titles`),
  create: (data) => client.post(`${BASE}/titles`, data),
  update: (id, data) => client.put(`${BASE}/titles/${id}`, data),
  delete: (id) => client.delete(`${BASE}/titles/${id}`),
};

export const positionsApi = {
  list: () => client.get(`${BASE}/positions`),
  get: (id) => client.get(`${BASE}/positions/${id}`),
  detail: (id) => client.get(`${BASE}/positions/${id}/detail`),
  create: (data) => client.post(`${BASE}/positions`, data),
  update: (id, data) => client.put(`${BASE}/positions/${id}`, data),
  delete: (id) => client.delete(`${BASE}/positions/${id}`),
  assignUnits: (posId, unitIds) => client.post(`${BASE}/positions/${posId}/units`, { unitIds }),
  removeUnit: (posId, unitId) => client.delete(`${BASE}/positions/${posId}/units/${unitId}`),
  assignRoles: (posId, roleIds) => client.post(`${BASE}/positions/${posId}/roles`, { roleIds }),
  removeRole: (posId, roleId) => client.delete(`${BASE}/positions/${posId}/roles/${roleId}`),
};

export const clearApi = {
  delete: (key) => client.delete(`/api/clear/${key}`),
};

export const usersApi = {
  list: () => client.get(`${BASE}/users`),
  get: (id) => client.get(`${BASE}/users/${id}`),
  create: (data) => client.post(`${BASE}/users`, data),
  update: (id, data) => client.put(`${BASE}/users/${id}`, data),
  updateAccess: (id, data) => client.put(`${BASE}/users/${id}/access`, data),
  delete: (id) => client.delete(`${BASE}/users/${id}`),
};
