import React from 'react';
import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const ProjectStudioProjectsTable = ({
  mode,
  isStudioEditView,
  visibleProjects = [],
  onOpenProject,
  onOpenTeams,
  onOpenWorkOrders,
  onOpenComments,
  onOpenActionItems,
  onOpenDraftSnapshot,
  associatedDraftsFor,
  plannedTeamCount,
  projectWorkOrderCount,
  formatMoney,
  formatDateTime,
}) => {
  const title = mode === 'active' ? 'Active Projects' : isStudioEditView ? 'Edit Projects' : 'Projects';
  const emptyColSpan = mode === 'active' ? 10 : 9;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Chip label={`${visibleProjects.length} shown`} />
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Estimate / Actual</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>Work Orders</TableCell>
              {mode === 'active' && <TableCell>Draft Snapshot</TableCell>}
              <TableCell>Comments</TableCell>
              <TableCell>Action Items</TableCell>
              <TableCell>Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleProjects.map(project => (
              <TableRow key={project.projectID} hover>
                <TableCell>
                  {mode === 'active' || isStudioEditView ? (
                    <Button
                      size="small"
                      onClick={() => onOpenProject(project)}
                      sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                    >
                      {project.projectName || `Project #${project.projectID}`}
                    </Button>
                  ) : (
                    <Typography variant="subtitle2">{project.projectName || `Project #${project.projectID}`}</Typography>
                  )}
                </TableCell>
                <TableCell>{project.projectStatus.replaceAll('_', ' ')}</TableCell>
                <TableCell>
                  <Typography variant="body2">{formatMoney(project.budget)}</Typography>
                  {project.projectStatus === 'OPEN' && (
                    <Typography variant="caption" color="text.secondary">
                      Difference: {formatMoney(project.budgetDifference)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {project.projectStatus === 'OPEN' ? (
                    <Typography variant="body2">Estimated: {formatMoney(project.estimatedCost)}</Typography>
                  ) : (
                    <Typography variant="body2">Actual: {formatMoney(project.actualCost)}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => onOpenTeams(project)}>
                    {plannedTeamCount(project)}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => onOpenWorkOrders(project)}>
                    {projectWorkOrderCount(project)}
                  </Button>
                </TableCell>
                {mode === 'active' && (
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Draft</InputLabel>
                      <Select
                        value=""
                        label="Draft"
                        onChange={event => onOpenDraftSnapshot(project, event.target.value)}
                        disabled={!associatedDraftsFor(project).length}
                      >
                        <MenuItem value="">Select draft</MenuItem>
                        {associatedDraftsFor(project).map(draft => (
                          <MenuItem key={draft.projectID} value={draft.projectID}>
                            {draft.projectName || `Draft #${draft.projectID}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                )}
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => onOpenComments(project)}>
                    {(project.comments || []).length ? 'Yes' : 'No'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => onOpenActionItems(project)}>
                    {(project.actionItems || []).filter(item => item.completed).length}/{(project.actionItems || []).length}
                  </Button>
                </TableCell>
                <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
              </TableRow>
            ))}
            {!visibleProjects.length && (
              <TableRow>
                <TableCell colSpan={emptyColSpan}>No projects found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ProjectStudioProjectsTable;
