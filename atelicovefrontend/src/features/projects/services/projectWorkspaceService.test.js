import { fetchProjectWorkspaceData } from './projectWorkspaceService';
import { projectService } from '../../../services/projectService';
import { workOrderService } from '../../../services/workOrderService';
import { teamService } from '../../../services/teamService';
import { workerService } from '../../../services/workerService';
import { companyService } from '../../../services/companyService';

jest.mock('../../../services/projectService', () => ({ projectService: { getActive: jest.fn() } }));
jest.mock('../../../services/workOrderService', () => ({ workOrderService: { getActive: jest.fn() } }));
jest.mock('../../../services/teamService', () => ({ teamService: { getAll: jest.fn() } }));
jest.mock('../../../services/workerService', () => ({ workerService: { getActive: jest.fn() } }));
jest.mock('../../../services/companyService', () => ({ companyService: { getActive: jest.fn() } }));

const deferred = () => {
  let resolve;
  const promise = new Promise(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

beforeEach(() => jest.clearAllMocks());

test('loads all workspace data in parallel and preserves the returned shape', async () => {
  const pending = {
    projects: deferred(),
    workOrders: deferred(),
    teams: deferred(),
    workers: deferred(),
    companies: deferred(),
  };
  const data = {
    projects: [{ projectID: 1 }],
    workOrders: [{ workOrderID: 2 }],
    teams: [{ teamID: 3 }],
    workers: [{ workerID: 4 }],
    companies: [{ companyID: 5 }],
  };

  projectService.getActive.mockReturnValue(pending.projects.promise);
  workOrderService.getActive.mockReturnValue(pending.workOrders.promise);
  teamService.getAll.mockReturnValue(pending.teams.promise);
  workerService.getActive.mockReturnValue(pending.workers.promise);
  companyService.getActive.mockReturnValue(pending.companies.promise);

  const resultPromise = fetchProjectWorkspaceData();

  expect(projectService.getActive).toHaveBeenCalledTimes(1);
  expect(workOrderService.getActive).toHaveBeenCalledTimes(1);
  expect(teamService.getAll).toHaveBeenCalledTimes(1);
  expect(workerService.getActive).toHaveBeenCalledTimes(1);
  expect(companyService.getActive).toHaveBeenCalledTimes(1);

  Object.entries(pending).forEach(([key, request]) => request.resolve(data[key]));

  await expect(resultPromise).resolves.toEqual(data);
});
