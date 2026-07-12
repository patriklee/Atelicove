import { draftLaunchErrorMessage, isPlaceholderStaffingSlot } from '../features/projectStudio/draftUtils';

test('distinguishes planning-only staffing from active workers', () => {
  expect(isPlaceholderStaffingSlot({ workerID: null, workerName: 'Electrician' })).toBe(true);
  expect(isPlaceholderStaffingSlot({ workerID: 9 })).toBe(false);
  expect(isPlaceholderStaffingSlot({ workerID: 9, archived: true })).toBe(true);
});

test('turns invalid active references into an actionable launch error', () => {
  expect(draftLaunchErrorMessage(new Error('Worker not found'))).toMatch(/no longer active/i);
  expect(draftLaunchErrorMessage(new Error('Network unavailable'))).toBe('Network unavailable');
});
