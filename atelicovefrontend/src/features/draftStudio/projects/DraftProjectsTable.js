import React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
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

const DraftProjectsTable = ({
  projects = [],
  view = 'draft',
  onViewChange,
  onOpenProject,
  onOpenWorkOrders,
  formatMoney,
  formatDateTime,
  projectDraftEstimatedCost,
  plannedTeamCount,
  projectWorkOrderCount,
}) => {
  const isActiveView = view === 'active';

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {isActiveView ? 'Active Projects' : 'Draft Projects'}
          </Typography>
          <ButtonGroup size="small" variant="outlined" aria-label="Draft Studio project table view">
            <Button
              variant={view === 'draft' ? 'contained' : 'outlined'}
              onClick={() => onViewChange?.('draft')}
            >
              Draft
            </Button>
            <Button
              variant={isActiveView ? 'contained' : 'outlined'}
              onClick={() => onViewChange?.('active')}
            >
              Active
            </Button>
          </ButtonGroup>
        </Box>
        <Stack direction="row" spacing={1} justifyContent={{ xs: 'space-between', sm: 'flex-end' }} alignItems="center">
          <Chip label={`${projects.length} ${isActiveView ? 'active' : 'drafts'}`} />
        </Stack>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>{isActiveView ? 'Actual' : 'Estimated'}</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>Work Orders</TableCell>
              <TableCell>Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map(project => (
              <TableRow key={project.projectID} hover>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => onOpenProject?.(project)}
                    sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                  >
                    {project.projectName || `Project #${project.projectID}`}
                  </Button>
                </TableCell>
                <TableCell>{formatMoney(project.budget)}</TableCell>
                <TableCell>{formatMoney(isActiveView ? project.actualCost : projectDraftEstimatedCost(project))}</TableCell>
                <TableCell>{plannedTeamCount(project)}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onOpenWorkOrders?.(project)}
                  >
                    {projectWorkOrderCount(project)}
                  </Button>
                </TableCell>
                <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
              </TableRow>
            ))}
            {!projects.length && (
              <TableRow>
                <TableCell colSpan={6}>No {view} projects found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DraftProjectsTable;
