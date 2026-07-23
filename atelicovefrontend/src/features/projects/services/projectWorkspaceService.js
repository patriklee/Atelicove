import { projectService } from '../../../services/projectService';
import { workOrderService } from '../../../services/workOrderService';
import { teamService } from '../../../services/teamService';
import { workerService } from '../../../services/workerService';
import { companyService } from '../../../services/companyService';

export const fetchProjectWorkspaceData = async () => {
  const [projects, workOrders, teams, workers, companies] = await Promise.all([
    projectService.getActive(),
    workOrderService.getActive(),
    teamService.getAll(),
    workerService.getActive(),
    companyService.getActive(),
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
