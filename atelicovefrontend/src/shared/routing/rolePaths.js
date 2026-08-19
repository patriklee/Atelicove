export const roleLandingPath = (user) => (
  user?.isAdmin ? '/admin' : '/worker/my-assignments'
);

export const projectPathFor = (user, projectID) => (
  user?.isAdmin
    ? `/admin/projects/${projectID}`
    : `/worker/projects/${projectID}/edit`
);

export const workOrderPathFor = (user, workOrderID) => (
  user?.isAdmin
    ? `/admin/workorders/${workOrderID}`
    : `/worker/my-assignments/${workOrderID}`
);
