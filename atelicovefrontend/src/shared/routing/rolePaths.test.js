import { projectPathFor, roleLandingPath, workOrderPathFor } from './rolePaths';

test('builds role-appropriate landing and shared entity paths', () => {
  expect(roleLandingPath({ isAdmin: true })).toBe('/admin');
  expect(roleLandingPath({ isAdmin: false })).toBe('/worker/my-assignments');
  expect(projectPathFor({ isAdmin: false }, 42)).toBe('/worker/projects/42/edit');
  expect(workOrderPathFor({ isAdmin: false }, 9)).toBe('/worker/my-assignments/9');
  expect(projectPathFor({ isAdmin: true }, 42)).toBe('/admin/projects/42');
});
