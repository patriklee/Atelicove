import React from 'react';
import {
  Button,
  Chip,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { formatDateTime } from '../../../model';
import { PageSurface } from '../../../shared/components/layout';
import { TableNavigationButton } from '../../../shared/components/navigation';
import { EntityEmptyState } from '../../../shared/components/tables';

const ProjectReviewArchivePanel = ({
  reviewProjects = [],
  archiveProjects = [],
  saving = false,
  projectReadyToArchive,
  onOpenProject,
  onApproveProject,
  onDenyProject,
  onArchiveProject,
}) => (
  <Grid container spacing={3} sx={{ mt: 3, mb: 3 }}>
    <Grid item xs={12} lg={6}>
      <PageSurface sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" component="h2">Review Projects</Typography>
          <Chip label={`${reviewProjects.length} waiting`} />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Work Orders</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviewProjects.map(project => (
                <TableRow key={project.projectID} hover>
                  <TableCell>
                    <TableNavigationButton
                      onClick={() => onOpenProject(project)}
                      sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                    >
                      {project.projectName || `Project #${project.projectID}`}
                    </TableNavigationButton>
                  </TableCell>
                  <TableCell>{(project.workOrders || []).length || project.workOrderCount || 0}</TableCell>
                  <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" variant="contained" color="success" disabled={saving} onClick={() => onApproveProject(project)}>
                        Approve
                      </Button>
                      <Button size="small" variant="outlined" color="error" disabled={saving} onClick={() => onDenyProject(project)}>
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!reviewProjects.length && (
                <EntityEmptyState message="No projects are waiting for review." colSpan={4} />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </PageSurface>
    </Grid>

    <Grid item xs={12} lg={6}>
      <PageSurface sx={{ height: '100%' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Projects</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>Completion</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {archiveProjects.map(project => (
                <TableRow key={project.projectID} hover>
                  <TableCell>
                    <TableNavigationButton
                      onClick={() => onOpenProject(project)}
                      sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                    >
                      {project.projectName || `Project #${project.projectID}`}
                    </TableNavigationButton>
                  </TableCell>
                  <TableCell>{project.projectStatus.replaceAll('_', ' ')}</TableCell>
                  <TableCell>{formatDateTime(project.activatedAt || project.projectStartedAt || project.startedAt)}</TableCell>
                  <TableCell>{formatDateTime(project.completedAt)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      disabled={saving || !projectReadyToArchive(project)}
                      onClick={() => onArchiveProject(project)}
                    >
                      Archive
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!archiveProjects.length && (
                <EntityEmptyState message="No projects are available for archiving." colSpan={5} />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </PageSurface>
    </Grid>
  </Grid>
);

export default ProjectReviewArchivePanel;
