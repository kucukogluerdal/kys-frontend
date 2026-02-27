import client from './client';

const BASE = '/api/processes';

export const processesApi = {
  list:     ()         => client.get(`${BASE}`),
  get:      (id)       => client.get(`${BASE}/${id}`),
  create:   (data)     => client.post(`${BASE}`, data),
  update:   (id, data) => client.put(`${BASE}/${id}`, data),
  delete:   (id)       => client.delete(`${BASE}/${id}`),
  autoLink: ()         => client.post(`${BASE}/auto-link`),

  // IOs
  listIos:   (id)       => client.get(`${BASE}/${id}/ios`),
  addIo:     (id, data) => client.post(`${BASE}/${id}/ios`, data),
  deleteIo:  (id, ioId) => client.delete(`${BASE}/${id}/ios/${ioId}`),

  // Parties
  listParties:   (id)          => client.get(`${BASE}/${id}/parties`),
  addParty:      (id, data)    => client.post(`${BASE}/${id}/parties`, data),
  deleteParty:   (id, partyId) => client.delete(`${BASE}/${id}/parties/${partyId}`),

  // Steps
  listSteps:   (id)           => client.get(`${BASE}/${id}/steps`),
  addStep:     (id, data)     => client.post(`${BASE}/${id}/steps`, data),
  updateStep:  (id, stepId, data) => client.put(`${BASE}/${id}/steps/${stepId}`, data),
  deleteStep:  (id, stepId)   => client.delete(`${BASE}/${id}/steps/${stepId}`),

  // Roles
  listRoles:  (id)         => client.get(`${BASE}/${id}/roles`),
  addRole:    (id, roleId) => client.post(`${BASE}/${id}/roles`, { roleId }),
  removeRole: (id, roleId) => client.delete(`${BASE}/${id}/roles/${roleId}`),

  // Risks
  listRisks:   (id)           => client.get(`${BASE}/${id}/risks`),
  addRisk:     (id, data)     => client.post(`${BASE}/${id}/risks`, data),
  updateRisk:  (id, riskId, data) => client.put(`${BASE}/${id}/risks/${riskId}`, data),
  deleteRisk:  (id, riskId)   => client.delete(`${BASE}/${id}/risks/${riskId}`),

  // KPIs (process-specific)
  listKpis:   (id)          => client.get(`${BASE}/${id}/kpis`),
  addKpi:     (id, data)    => client.post(`${BASE}/${id}/kpis`, data),
  deleteKpi:  (id, kpiId)   => client.delete(`${BASE}/${id}/kpis/${kpiId}`),

  // Stakeholders
  listStakeholders:   (id)        => client.get(`${BASE}/${id}/stakeholders`),
  addStakeholder:     (id, data)  => client.post(`${BASE}/${id}/stakeholders`, data),
  deleteStakeholder:  (id, shId)  => client.delete(`${BASE}/${id}/stakeholders/${shId}`),

  // Draft Steps
  listDraftSteps:    (id)        => client.get(`${BASE}/${id}/draft-steps`),
  addDraftStep:      (id, data)  => client.post(`${BASE}/${id}/draft-steps`, data),
  deleteDraftStep:   (id, sid)   => client.delete(`${BASE}/${id}/draft-steps/${sid}`),
  draftStepTemplate: (id)        => client.get(`${BASE}/${id}/draft-steps/template`, { responseType: 'blob' }),
  importDraftSteps:  (id, form)  => client.post(`${BASE}/${id}/draft-steps/import`, form),

  // Process Card Excel
  exportCard:   (id)      => client.get(`/api/process-card/${id}/export`, { responseType: 'blob' }),
  importCard:   (formData) => client.post(`/api/process-card/import`, formData),
  templateCard: ()         => client.get(`/api/process-card/template`, { responseType: 'blob' }),
};

export const processCodeConfigApi = {
  get:    ()       => client.get('/api/process-code-config'),
  save:   (data)   => client.post('/api/process-code-config', data),
  delete: ()       => client.delete('/api/process-code-config'),
  test:   (code)   => client.post('/api/process-code-config/test', { code }),
};

export const kpisApi = {
  list:   ()         => client.get(`${BASE}/kpis`),
  get:    (id)       => client.get(`${BASE}/kpis/${id}`),
  create: (data)     => client.post(`${BASE}/kpis`, data),
  update: (id, data) => client.put(`${BASE}/kpis/${id}`, data),
  delete: (id)       => client.delete(`${BASE}/kpis/${id}`),
};
