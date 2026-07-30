import React from 'react';
import {
  Button,
  Chip,
  Grid,
  Paper,
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

const ProjectLinkButton = ({ project, onOpenProject }) => (
  <Button
    size="small"
    onClick={() => onOpenProject(project)}
    sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
  >
    {project.projectName || `Project #${project.projectID}`}
  </Button>
);

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
      <Paper sx={{ p: 3, height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5">Review Projects</Typography>
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
                <TableRow key={project.projectID}>
                  <TableCell>
                    <ProjectLinkButton project={project} onOpenProject={onOpenProject} />
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
                <TableRow>
                  <TableCell colSpan={4}>No projects are waiting for review.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Grid>

    <Grid item xs={12} lg={6}>
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Projects</Typography>
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
                <TableRow key={project.projectID}>
                  <TableCell>
                    <ProjectLinkButton project={project} onOpenProject={onOpenProject} />
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
                <TableRow>
                  <TableCell colSpan={5}>No projects are available for archiving.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Grid>
  </Grid>
);

export default ProjectReviewArchivePanel;
