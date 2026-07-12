import { apiFetch } from '../shared/api';
import { projectService } from './projectService';

jest.mock('../shared/api', () => ({ apiFetch: jest.fn(), apiDownload: jest.fn() }));

test('launch treats a draft as the source of a newly created project', async () => {
  apiFetch.mockResolvedValue({ projectID: 42 });

  await projectService.launchDraft(7);

  expect(apiFetch).toHaveBeenCalledWith('/draft-projects/7/launch', { method: 'POST' });
});
