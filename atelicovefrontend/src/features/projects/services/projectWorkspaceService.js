import { apiFetch } from '../../../shared/api/client';

export const fetchProjectWorkspaceData = async () => {
  const [projects, workOrders, teams, workers, companies] = await Promise.all([
    apiFetch('/projects/all-with-archived'),
    apiFetch('/workorders'),
    apiFetch('/teams'),
    apiFetch('/workers'),
    apiFetch('/companies'),
  ]);

  return {
    projects,
    workOrders,
    teams,
    workers,
    companies,
  };
};

export default fetchProjectWorkspaceData;
