import { apiFetch } from '../shared/api';

export const companyService = {
  getAll: () => apiFetch('/companies'),
  getActive: () => apiFetch('/companies/active'),
  getArchived: () => apiFetch('/companies/archived'),
  getById: (companyID) => apiFetch(`/companies/${companyID}`),
  create: (payload) => apiFetch('/companies', { method: 'POST', body: JSON.stringify(payload) }),
  update: (companyID, payload) => apiFetch(`/companies/${companyID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archive: (companyID) => apiFetch(`/companies/${companyID}/archive`, { method: 'PATCH' }),
  restore: (companyID) => apiFetch(`/companies/${companyID}/restore`, { method: 'PATCH' }),
};
