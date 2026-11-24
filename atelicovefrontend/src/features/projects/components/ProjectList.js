import React from 'react';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { formatDateTime, formatMoney } from '../../../model';
import { EntityEmptyState } from '../../../shared/components/tables';
import { getBudgetHealth, getProjectHealth } from '../../admin/dashboard/dashboardUtils';

const statusConfig = {
  OPEN: {
    label: 'Planning',
    sx: {
      bgcolor: 'brand.soft',
      borderColor: 'primary.light',
      color: 'primary.dark',
    },
  },
  IN_REVIEW: {
    label: 'Needs Review',
    sx: {
      bgcolor: 'warning.light',
      borderColor: 'warning.light',
      color: 'warning.dark',
    },
  },
  COMPLETE: {
    label: 'Complete',
    sx: {
      bgcolor: 'success.light',
      borderColor: 'success.light',
      color: 'success.dark',
    },
  },
};

const formatRelativeTime = (value, now = Date.now()) => {
  if (!value) return 'Not available';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return String(value);

  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (elapsedSeconds < 60) return 'Just now';
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const months = Math.floor(days / 30);
  if (days < 365) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

function ProjectProgress({ project }) {
  const health = getProjectHealth(project);
  const workOrders = Array.isArray(project.workOrders) ? project.workOrders : [];
  if (!health.configured) {
    return <Typography variant="body2" color="text.secondary">{health.label}</Typography>;
  }
  const completedCount = workOrders.filter(order => order.status === 'COMPLETE').length;
  const progressLabel = workOrders.length
    ? `${completedCount} of ${workOrders.length} complete`
    : health.label;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600}>{health.percent}%</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.125 }}>
        {progressLabel}
      </Typography>
      <LinearProgress
        color={project.projectStatus === 'IN_REVIEW' ? 'warning' : 'primary'}
        variant="determinate"
        value={health.percent}
        sx={{ mt: 0.75, height: 5, borderRadius: 99 }}
      />
    </Box>
  );
}

function BudgetUsage({ project }) {
  const health = getBudgetHealth(project);
  if (!health.configured) {
    return <Typography variant="body2" color="text.secondary">Not configured</Typography>;
  }
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
        {formatMoney(health.spent)} / {formatMoney(health.budget)}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.125 }}>
        {Math.max(0, health.percent)}% used
      </Typography>
      <LinearProgress
        color={health.severity}
        variant="determinate"
        value={Math.min(100, Math.max(0, health.percent))}
        sx={{ mt: 0.75, height: 5, borderRadius: 99 }}
      />
    </Box>
  );
}

function ProjectTeams({ teams = [] }) {
  if (!teams.length) {
    return <Typography variant="body2" color="text.secondary">Unassigned</Typography>;
  }

  const teamNames = teams.map(team => team.teamName || `Team #${team.teamID}`);
  const visibleTeams = teams.slice(0, 3);
  return (
    <Tooltip title={teamNames.join(', ')} placement="top">
      <Box
        aria-label={`Teams: ${teamNames.join(', ')}`}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', minWidth: 0 }}
      >
        {visibleTeams.map(team => (
          <Chip
            key={team.teamID}
            size="small"
            variant="outlined"
            label={team.teamName || `Team #${team.teamID}`}
            sx={{
              maxWidth: 82,
              bgcolor: 'background.paper',
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            }}
          />
        ))}
        {teams.length > visibleTeams.length && (
          <Chip
            size="small"
            label={`+${teams.length - visibleTeams.length}`}
            aria-label={`${teams.length - visibleTeams.length} more teams`}
            sx={{ flex: '0 0 auto', bgcolor: 'brand.soft', color: 'primary.dark' }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

function WorkOrderCount({ workOrders = [] }) {
  const hasStatusData = workOrders.some(order => Boolean(order.status));
  const openCount = workOrders.filter(order => (
    !order.archived && Boolean(order.status) && order.status !== 'COMPLETE'
  )).length;

  return (
    <Box>
      <Typography variant="body2" fontWeight={600}>{workOrders.length}</Typography>
      {hasStatusData && workOrders.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          {openCount} open
        </Typography>
      )}
    </Box>
  );
}

function UpdatedTime({ value }) {
  const fullTimestamp = formatDateTime(value);
  const relativeTime = formatRelativeTime(value);
  return (
    <Tooltip title={fullTimestamp} placement="top">
      <Typography
        variant="body2"
        color="text.secondary"
        noWrap
        aria-label={`${relativeTime}; ${fullTimestamp}`}
      >
        {relativeTime}
      </Typography>
    </Tooltip>
  );
}

export default function ProjectList({
  projects,
  canManage,
  onEdit,
  onOpen,
}) {
  const activeProjects = projects.filter(project => !project.archived).sort((first, second) => (
    (Date.parse(second.lastModifiedAt) || 0) - (Date.parse(first.lastModifiedAt) || 0)
    || (first.projectName || `Project #${first.projectID}`).localeCompare(second.projectName || `Project #${second.projectID}`)
  ));

  return (
    <Paper
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: theme => theme.customShadows.soft,
        overflow: 'hidden',
      }}
    >
      <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
        <Table
          size="small"
          sx={{
            minWidth: 1100,
            tableLayout: 'fixed',
            '& .MuiTableCell-root': { py: 1.25, px: 1.5 },
            '& .MuiTableCell-head': { whiteSpace: 'nowrap' },
          }}
        >
          <colgroup>
            {[16, 12, 12, 15, 12, 9, 10, 14].map((width, index) => (
              <col key={index} style={{ width: `${width}%` }} />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell align="center">Work Orders</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeProjects.map(project => {
              const status = statusConfig[project.projectStatus || 'OPEN'] || {
                label: (project.projectStatus || 'OPEN').replaceAll('_', ' '),
                sx: {
                  bgcolor: 'background.subtle',
                  borderColor: 'divider',
                  color: 'text.secondary',
                },
              };
              const teams = project.teams || [];
              const workOrders = project.workOrders || [];
              const projectName = project.projectName || `Project #${project.projectID}`;
              return (
                <TableRow key={project.projectID} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {projectName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>
                      Project #{project.projectID}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={status.label} sx={status.sx} />
                  </TableCell>
                  <TableCell><ProjectProgress project={project} /></TableCell>
                  <TableCell><BudgetUsage project={project} /></TableCell>
                  <TableCell><ProjectTeams teams={teams} /></TableCell>
                  <TableCell align="center"><WorkOrderCount workOrders={workOrders} /></TableCell>
                  <TableCell><UpdatedTime value={project.lastModifiedAt} /></TableCell>
                  <TableCell align="right">
                    <Stack spacing={0.5} alignItems="flex-end" sx={{ '& .MuiButton-root': { whiteSpace: 'nowrap' } }}>
                      <Button variant="outlined" size="small" onClick={() => onOpen(project)}>
                        Open Workspace
                      </Button>
                      {canManage && (
                        <Button size="small" onClick={() => onEdit(project)}>Edit Project</Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {!activeProjects.length && (
              <EntityEmptyState
                message="No active projects found."
                colSpan={8}
              />
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
