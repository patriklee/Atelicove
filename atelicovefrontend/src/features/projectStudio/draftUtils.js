export const isPlaceholderStaffingSlot = (slot = {}) => !Number(slot.workerID) || slot.archived === true;

export const draftLaunchErrorMessage = (error) => {
  const message = error?.message || 'Project launch failed.';
  return /archiv|inactive|not found|no longer active|invalid.*(worker|team|company|source)/i.test(message)
    ? `This draft references an entity that is no longer active. Review the highlighted staffing or work-order fields before launching again. ${message}`
    : message;
};
