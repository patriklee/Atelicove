import { projectService } from '../../../services/projectService';
import { workOrderService } from '../../../services/workOrderService';
import { companyService } from '../../../services/companyService';
import { workerService } from '../../../services/workerService';
import { apiFetch } from '../../../api';

export const dashboardService = {
  load: async () => {
    const [projects, workOrders, companies, workers] = await Promise.all([
      projectService.getActive(),
      workOrderService.getActive(),
      companyService.getActive(),
      workerService.getActive(),
    ]);
    return { projects, workOrders, companies, workers };
  },
  createDeadline: (projectID, payload) => apiFetch(`/projects/${projectID}/action-items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateDeadline: (projectID, actionItemID, payload) =>
    apiFetch(`/projects/${projectID}/action-items/${actionItemID}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
