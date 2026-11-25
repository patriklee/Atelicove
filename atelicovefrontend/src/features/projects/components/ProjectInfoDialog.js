import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { formatDateTime, formatMoney } from '../../../model';
import { AppAlert } from '../../../shared/icons';
import useProjectsPage from '../hooks/useProjectsPage';

export default function ProjectInfoDialog({ projectID, onClose }) {
  const { selectedProject: project, loading, message } = useProjectsPage({
    routeProjectID: projectID, mode: 'details', canManage: false,
  });
  const fields = project ? [
    ['Project ID', project.projectID],
    ['Description', project.description],
    ['Status', project.projectStatus?.replaceAll('_', ' ')],
    ['Budget', project.budget == null ? null : formatMoney(project.budget)],
    ['Actual cost', project.actualCost == null ? null : formatMoney(project.actualCost)],
    ['Teams', (project.teamIDs || project.teams?.map(team => team.teamID) || []).join(', ')],
    ['Work orders', (project.workOrderIDs || project.workOrders?.map(order => order.workOrderID) || []).join(', ')],
    ['Created', project.createdAt && formatDateTime(project.createdAt)],
    ['Updated', project.lastModifiedAt && formatDateTime(project.lastModifiedAt)],
    ['Activated', project.activatedAt && formatDateTime(project.activatedAt)],
    ['Completed', project.completedAt && formatDateTime(project.completedAt)],
    ['Archived', project.archived ? 'Yes' : 'No'],
    ['Archived at', project.archivedAt && formatDateTime(project.archivedAt)],
  ] : [];

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="project-info-title">
      <DialogTitle id="project-info-title">{project?.projectName || `Project #${projectID}`}</DialogTitle>
      <DialogContent>
        {loading ? <CircularProgress /> : message ? <AppAlert severity={message.severity}>{message.text}</AppAlert>
          : !project ? <AppAlert severity="warning">Project not found.</AppAlert> : (
            <Stack component="dl" spacing={2} sx={{ m: 0 }}>
              {fields.map(([label, value]) => (
                <div key={label}>
                  <Typography component="dt" variant="subtitle2">{label}</Typography>
                  <Typography component="dd" variant="body2" sx={{ m: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {value === '' || value == null ? 'Not available' : value}
                  </Typography>
                </div>
              ))}
            </Stack>
          )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}
