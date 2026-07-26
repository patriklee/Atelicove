import { apiFetch } from '../shared/api';

export const companyService = {
  getAllIncludingArchived: () => apiFetch('/companies/all-with-archived'),
  getAllActive: () => apiFetch('/companies/all'),
  getActive: () => apiFetch('/companies'),
  getArchived: () => apiFetch('/companies/archived'),
  create: (payload) => apiFetch('/companies/add', { method: 'POST', body: JSON.stringify(payload) }),
  update: (companyID, payload) => apiFetch(`/companies/${companyID}`, { method: 'PUT', body: JSON.stringify(payload) }),
  archive: (companyID) => apiFetch(`/companies/${companyID}`, { method: 'DELETE' }),
  restore: (companyID) => apiFetch(`/companies/${companyID}/restore`, { method: 'PUT' }),
};
