import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import {
  AppAlert,
  AppIcon,
  AppIconButton,
  ICON_SIZES,
  icons,
} from '../../../shared/icons';
import { ConfirmationDialog } from '../../../shared/components/dialogs';
import { useAuth } from '../../../Components/AuthContext';
import { getWorkOrderWorkers, normalizeWorker } from '../../../model';
import useAdminDashboard from './useAdminDashboard';
import {
  DASHBOARD_SEVERITY,
  dateKey,
  getBudgetHealth,
  getProjectHealth,
  groupDeadlinesByDate,
  isDeadlineToday,
} from './dashboardUtils';

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: theme => theme.customShadows.soft,
  bgcolor: 'background.paper',
};

const dashboardContentGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'minmax(0, 1fr)',
    lg: 'minmax(0, 1.65fr) minmax(300px, 1fr)',
  },
  gap: 3,
  alignItems: 'start',
};

const formatDueDate = value => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(value));

const autocompleteIconProps = {
  clearIcon: <AppIcon icon={icons.close} size={ICON_SIZES.compact} />,
  popupIcon: <AppIcon icon={icons.expand} size={ICON_SIZES.compact} />,
};

function SectionHeading({ icon, iconColor = 'primary.main', title, subtitle, action, sx }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2, ...sx }}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon && (
            <Box component="span" sx={{ color: iconColor, display: 'inline-flex' }}>
              <AppIcon icon={icon} />
            </Box>
          )}
          <Typography variant="h6" component="h2">{title}</Typography>
        </Stack>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Stack>
  );
}

function DashboardSearch({ query, onQueryChange, groups, searchReady, onNavigate }) {
  const [focused, setFocused] = useState(false);
  const hasResults = groups.length > 0;
  const open = focused && query.trim().length >= 2;

  return (
    <Box sx={{
      position: 'relative',
      flex: { xs: '1 1 auto', md: '0 0 auto' },
      minWidth: 0,
      width: { xs: 'auto', md: 420 },
      zIndex: 5,
    }}>
      <TextField
        value={query}
        onChange={event => onQueryChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={event => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setFocused(false);
        }}
        label="Search"
        placeholder="Projects, work orders, companies, or workers"
        size="small"
        fullWidth
        inputProps={{ 'aria-controls': open ? 'dashboard-search-results' : undefined }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ color: 'action.active' }}>
              <AppIcon icon={icons.search} />
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 3 } }}
      />
      {open && (
        <Paper
          id="dashboard-search-results"
          role="listbox"
          sx={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            maxHeight: 420,
            overflowY: 'auto',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 6,
          }}
        >
          {!searchReady && <Typography sx={{ p: 2 }}>Keep typing to search.</Typography>}
          {searchReady && !hasResults && (
            <Typography color="text.secondary" sx={{ p: 2 }}>No matching records found.</Typography>
          )}
          {groups.map(group => (
            <Box key={group.type}>
              <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 1.5, display: 'block' }}>
                {group.type}
              </Typography>
              <List dense disablePadding>
                {group.items.map(item => (
                  <ListItemButton key={`${group.type}-${item.id}`} onMouseDown={() => onNavigate(item.path)}>
                    <ListItemText primary={item.primary} secondary={item.secondary} />
                    <Box component="span" sx={{ color: 'action.active', display: 'inline-flex' }}>
                      <AppIcon icon={icons.disclosure} size={ICON_SIZES.compact} />
                    </Box>
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}

function DashboardAlerts({ items, onNavigate }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const alertCount = items.reduce((total, item) => total + item.count, 0);
  const hasAlerts = alertCount > 0;
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<AppIcon icon={icons.notifications} />}
        aria-haspopup="dialog"
        aria-expanded={open || undefined}
        onClick={event => setAnchorEl(event.currentTarget)}
        sx={hasAlerts ? {
          flexShrink: 0,
          bgcolor: '#F1E0DD',
          borderColor: '#D7AAA5',
          color: '#7D433E',
          '&:hover': {
            bgcolor: '#EAD2CE',
            borderColor: '#C9918B',
          },
        } : { flexShrink: 0 }}
      >
        Alerts{hasAlerts ? ` (${alertCount})` : ''}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 'calc(100vw - 32px)', sm: 380 },
              mt: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              boxShadow: theme => theme.customShadows.floating,
            },
          },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="h6">Alerts</Typography>
          <Typography variant="body2" color="text.secondary">
            Items that need attention
          </Typography>
        </Box>
        {items.length ? (
          <List disablePadding sx={{ pb: 1 }}>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setAnchorEl(null);
                      onNavigate(item.path);
                    }}
                    sx={{ px: 2, py: 1.25 }}
                  >
                    <ListItemText
                      primary={item.label}
                      secondary={DASHBOARD_SEVERITY[item.severity].label}
                    />
                    <Chip label={item.count} size="small" color={DASHBOARD_SEVERITY[item.severity].color} />
                    <Box component="span" sx={{ color: 'action.active', display: 'inline-flex', ml: 0.75 }}>
                      <AppIcon icon={icons.disclosure} size={ICON_SIZES.compact} />
                    </Box>
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
            No operational exceptions require attention.
          </Typography>
        )}
      </Popover>
    </>
  );
}

function OperationsOverview({ data, onNavigate }) {
  const cards = [
    {
      label: 'Projects',
      value: data.projects.length,
      detail: `${data.projects.filter(item => item.projectStatus === 'IN_REVIEW').length} awaiting review`,
      icon: icons.projects,
      path: '/admin/projects/active',
    },
    {
      label: 'Work Orders',
      value: data.workOrders.length,
      detail: `${data.workOrders.filter(item => item.status === 'IN_PROCESS').length} in process`,
      icon: icons.workOrders,
      path: '/admin/workorders',
    },
    {
      label: 'Companies',
      value: data.companies.length,
      detail: 'Active companies',
      icon: icons.companies,
      path: '/admin/companies',
    },
    {
      label: 'Workers',
      value: data.workers.length,
      detail: `${data.workers.filter(worker => !worker.archived).length} active`,
      icon: icons.workers,
      path: '/admin/workers',
    },
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap: 2 }}>
      {cards.map(card => (
        <Paper
          key={card.label}
          component="button"
          type="button"
          onClick={() => onNavigate(card.path)}
          sx={{
            ...cardSx,
            p: 2.5,
            textAlign: 'left',
            font: 'inherit',
            cursor: 'pointer',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: theme => theme.customShadows.floating },
            '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.light', outlineOffset: 2 },
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="text.secondary" variant="body2">{card.label}</Typography>
              <Typography variant="h4" sx={{ mt: 0.5, color: 'text.primary' }}>{card.value}</Typography>
              <Typography variant="caption" color="text.secondary">{card.detail}</Typography>
            </Box>
            <Box sx={{ p: 1, borderRadius: 2, color: 'brand.secondary', bgcolor: 'brand.soft', display: 'flex' }}>
              <AppIcon icon={card.icon} size={22} />
            </Box>
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}

const healthProgressSx = percent => theme => ({
  flex: 1,
  height: 7,
  borderRadius: 99,
  bgcolor: theme.palette.background.subtle,
  '& .MuiLinearProgress-bar': {
    borderRadius: 99,
    backgroundColor: alpha(
      theme.palette.brand.secondary,
      0.28 + (Math.min(100, Math.max(0, percent)) / 100) * 0.72
    ),
  },
});

function HealthProgress({ health, label }) {
  if (!health.configured) {
    return <Typography variant="body2" color="text.secondary">{health.label}</Typography>;
  }
  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 145 }}>
      <Typography variant="body2" sx={{ minWidth: 38 }}>{health.percent}%</Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, Math.max(0, health.percent))}
        aria-label={`${label} ${health.percent} percent`}
        sx={healthProgressSx(health.percent)}
      />
    </Stack>
  );
}

function BudgetHealth({ health }) {
  if (!health.configured) return <Chip size="small" variant="outlined" label={health.label} />;
  return <HealthProgress health={health} label="Budget used" />;
}

const projectStatusSx = {
  OPEN: {
    bgcolor: '#EDEAE4',
    color: '#525D63',
  },
  IN_REVIEW: {
    bgcolor: '#DCE6DC',
    color: '#526F59',
  },
  COMPLETE: {
    bgcolor: '#77997E',
    color: '#FFFFFF',
  },
};

const assignmentStatusSx = {
  OPEN: projectStatusSx.OPEN,
  IN_PROCESS: {
    bgcolor: '#DCE6DC',
    color: '#526F59',
  },
  ACTIVE: {
    bgcolor: '#DCE6DC',
    color: '#526F59',
  },
  IN_REVIEW: {
    bgcolor: '#E8E5D8',
    color: '#6A6242',
  },
  COMPLETE: projectStatusSx.COMPLETE,
};

function ProjectStatus({ status = 'OPEN' }) {
  return (
    <Chip
      size="small"
      label={status.replaceAll('_', ' ')}
      sx={projectStatusSx[status] || projectStatusSx.OPEN}
    />
  );
}

function ProjectOverviewTable({ projects, onNavigate }) {
  return (
    <Paper sx={{
      ...cardSx,
      p: { xs: 2, md: 2.5 },
      minHeight: { lg: 540 },
      height: '100%',
      overflow: 'hidden',
    }}>
      <SectionHeading
        icon={icons.projects}
        title="Project Overview"
        subtitle="Completion and budget signals for active projects"
      />
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="Project health overview">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Health</TableCell>
              <TableCell>Budget Health</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.slice(0, 8).map(project => (
              <TableRow key={project.projectID} hover>
                <TableCell sx={{ minWidth: 180 }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => onNavigate(`/admin/projects/${project.projectID}`)}
                    sx={{
                      p: 0,
                      minWidth: 0,
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      fontWeight: 600,
                      textTransform: 'none',
                    }}
                  >
                    {project.projectName || `Project #${project.projectID}`}
                  </Button>
                </TableCell>
                <TableCell><HealthProgress health={getProjectHealth(project)} label="Project health" /></TableCell>
                <TableCell><BudgetHealth health={getBudgetHealth(project)} /></TableCell>
                <TableCell><ProjectStatus status={project.projectStatus} /></TableCell>
              </TableRow>
            ))}
            {!projects.length && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    No active projects yet. Create a project to begin tracking operations.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function QuickActions({ onNavigate }) {
  const actions = [
    { label: 'Create Project', icon: icons.projects, path: '/admin/projects/active' },
    { label: 'Create Work Order', icon: icons.workOrders, path: '/admin/manage-workorders' },
    { label: 'Add Company', icon: icons.companies, path: '/admin/manage-companies' },
    { label: 'Add Worker', icon: icons.addWorker, path: '/admin/manage-workers' },
  ];
  return (
    <Paper sx={{ ...cardSx, p: 2, flex: '0 0 auto' }}>
      <SectionHeading title="Quick Actions" subtitle="Start common administrative work" />
      <Stack spacing={1}>
        {actions.map(action => (
          <Button
            key={action.label}
            variant="outlined"
            size="small"
            startIcon={<AppIcon icon={action.icon} />}
            onClick={() => onNavigate(action.path)}
            sx={{ justifyContent: 'flex-start' }}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  );
}

function getMyWorkOrders(workOrders, workerID) {
  const currentWorkerID = Number(workerID);
  if (!currentWorkerID) return [];

  return workOrders.filter(order => (
    !order.archived
    && getWorkOrderWorkers(order).some(worker => Number(worker.workerID) === currentWorkerID)
  ));
}

function getMyProjects(projects, workerID) {
  const currentWorkerID = Number(workerID);
  if (!currentWorkerID) return [];

  return projects.filter(project => {
    if (project.projectStatus !== 'OPEN') return false;
    const teamWorkers = (project.teams || [])
      .flatMap(team => team.workers || [])
      .map(normalizeWorker);
    const workOrderWorkers = (project.workOrders || [])
      .flatMap(order => getWorkOrderWorkers(order));
    return [...teamWorkers, ...workOrderWorkers]
      .some(worker => Number(worker.workerID) === currentWorkerID);
  });
}

function MyAssignmentsCard({ workOrders, myProjects, onNavigate }) {
  const hasAssignments = myProjects.length > 0 || workOrders.length > 0;

  return (
    <Paper sx={{
      ...cardSx,
      p: 2,
      minHeight: 0,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <SectionHeading
        icon={icons.assignments}
        title="My Assignments"
        subtitle="Work currently assigned to you"
        sx={{ mb: 1 }}
      />
      {hasAssignments ? (
        <TableContainer sx={{ minHeight: 0, flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader size="small" aria-label="My assignments">
            <TableHead>
              <TableRow>
                <TableCell>Assignment</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myProjects.map(project => (
                <TableRow key={`project-${project.projectID}`} hover>
                  <TableCell sx={{ maxWidth: 150 }}>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => onNavigate('/admin/projects/active', {
                          state: { projectStudioEditProjectID: project.projectID },
                        })}
                        sx={{ p: 0, minWidth: 0, fontWeight: 600, textTransform: 'none' }}
                      >
                        <Typography component="span" variant="body2" noWrap>
                          {project.projectName || `Project #${project.projectID}`}
                        </Typography>
                      </Button>
                  </TableCell>
                  <TableCell><Typography variant="body2">Project</Typography></TableCell>
                  <TableCell align="right">
                    <Chip size="small" label="OPEN" sx={projectStatusSx.OPEN} />
                  </TableCell>
                </TableRow>
              ))}
              {workOrders.map(order => {
                const assignmentName = order.workOrderName || order.title || `Work Order #${order.workOrderID}`;
                return (
                  <TableRow key={`work-order-${order.workOrderID}`} hover>
                    <TableCell sx={{ maxWidth: 150 }}>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => onNavigate(`/admin/my-assignments/${order.workOrderID}`)}
                          sx={{ p: 0, minWidth: 0, fontWeight: 600, textTransform: 'none' }}
                        >
                          <Typography component="span" variant="body2" noWrap>{assignmentName}</Typography>
                        </Button>
                    </TableCell>
                    <TableCell><Typography variant="body2">Work Order</Typography></TableCell>
                    <TableCell align="right">
                        <Chip
                          size="small"
                          label={(order.status || 'OPEN').replaceAll('_', ' ')}
                          sx={assignmentStatusSx[order.status] || assignmentStatusSx.OPEN}
                        />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ flex: 1, display: 'grid', placeContent: 'center', textAlign: 'center', py: 1 }}>
          <Typography variant="subtitle2">No assignments</Typography>
          <Typography variant="body2" color="text.secondary">You’re all caught up.</Typography>
        </Box>
      )}
      <Button
        size="small"
        endIcon={<AppIcon icon={icons.forward} size={ICON_SIZES.compact} />}
        onClick={() => onNavigate('/admin/my-assignments')}
        sx={{ mt: 'auto', pt: 1, alignSelf: 'flex-start' }}
      >
        View all assignments
      </Button>
    </Paper>
  );
}

function DeadlineDialog({ open, projects, saving, deleting, initialSelection, onClose, onSave, onDelete }) {
  const [project, setProject] = useState(null);
  const [actionItem, setActionItem] = useState(null);
  const [itemText, setItemText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deadlineToDelete, setDeadlineToDelete] = useState(null);
  const availableItems = useMemo(() => (project?.actionItems || []).filter(item => !item.completed), [project]);
  const selectedDayDeadlines = initialSelection?.deadlines || [];

  const selectDeadline = deadline => {
    const selectedProject = projects.find(item => item.projectID === deadline.projectID) || null;
    const selectedActionItem = selectedProject
      ? (selectedProject.actionItems || []).find(
        item => item.actionItemID === deadline.actionItemID
      ) || deadline
      : deadline;
    setProject(selectedProject);
    setActionItem(selectedActionItem);
    setItemText(selectedActionItem?.itemText || '');
    setDueDate(dateKey(selectedActionItem?.dueDate));
  };

  useEffect(() => {
    if (open) {
      if (initialSelection?.deadline) {
        const deadline = initialSelection.deadline;
        const selectedProject = projects.find(item => item.projectID === deadline.projectID) || null;
        const selectedActionItem = selectedProject
          ? (selectedProject.actionItems || []).find(
            item => item.actionItemID === deadline.actionItemID
          ) || deadline
          : deadline;
        setProject(selectedProject);
        setActionItem(selectedActionItem);
        setItemText(selectedActionItem?.itemText || '');
        setDueDate(dateKey(selectedActionItem?.dueDate));
      } else {
        setProject(null);
        setActionItem(null);
        setItemText('');
        setDueDate(dateKey(initialSelection?.date));
      }
    } else {
      setProject(null);
      setActionItem(null);
      setItemText('');
      setDueDate('');
      setDeadlineToDelete(null);
    }
  }, [initialSelection, open, projects]);

  const selectActionItem = item => {
    setActionItem(item);
    setItemText(item?.itemText || '');
    setDueDate(item?.dueDate ? String(item.dueDate).slice(0, 10) : '');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{actionItem ? 'Edit project deadline' : 'Create project deadline'}</DialogTitle>
      <DialogContent>
        <AppAlert severity="info" sx={{ mb: 2 }}>
          Community Edition deadlines are stored on project action items.
        </AppAlert>
        {selectedDayDeadlines.length > 0 && !actionItem && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Deadlines on {formatDueDate(initialSelection.date)}
            </Typography>
            <List dense disablePadding aria-label="Deadlines on selected date">
              {selectedDayDeadlines.map(deadline => (
                <ListItem
                  key={`${deadline.projectID}-${deadline.actionItemID}`}
                  disableGutters
                  secondaryAction={(
                    <Stack direction="row" spacing={0.5}>
                      <Button size="small" onClick={() => selectDeadline(deadline)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => setDeadlineToDelete(deadline)}>Delete</Button>
                    </Stack>
                  )}
                  sx={{ pr: 15 }}
                >
                  <ListItemText primary={deadline.itemText} secondary={deadline.projectName} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ mt: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Edit an existing deadline, or complete the form below to add another.
            </Typography>
          </Box>
        )}
        <Autocomplete
          {...autocompleteIconProps}
          options={projects.filter(item => item.projectStatus !== 'COMPLETE')}
          getOptionLabel={option => option.projectName || `Project #${option.projectID}`}
          value={project}
          onChange={(_, value) => { setProject(value); selectActionItem(null); }}
          renderInput={params => <TextField {...params} label="Project" margin="normal" required />}
        />
        <Autocomplete
          {...autocompleteIconProps}
          options={availableItems}
          getOptionLabel={option => option.itemText}
          value={actionItem}
          onChange={(_, value) => selectActionItem(value)}
          disabled={!project}
          renderInput={params => (
            <TextField {...params} label="Existing action item (optional)" margin="normal" helperText="Leave empty to create a new deadline." />
          )}
        />
        <TextField
          label="Deadline task"
          value={itemText}
          onChange={event => setItemText(event.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Due date"
          type="date"
          value={dueDate}
          onChange={event => setDueDate(event.target.value)}
          fullWidth
          margin="normal"
          required
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving || !project || !itemText.trim() || !dueDate}
          onClick={async () => {
            const saved = await onSave({ projectID: project.projectID, actionItem, itemText, dueDate });
            if (saved) onClose();
          }}
        >
          {saving ? 'Saving…' : actionItem ? 'Update deadline' : 'Create deadline'}
        </Button>
      </DialogActions>
      <ConfirmationDialog
        open={Boolean(deadlineToDelete)}
        title="Delete deadline"
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onCancel={() => setDeadlineToDelete(null)}
        onConfirm={async () => {
          const deleted = await onDelete({
            projectID: deadlineToDelete.projectID,
            actionItemID: deadlineToDelete.actionItemID,
          });
          if (deleted) onClose();
        }}
      >
        <Typography>
          Delete “{deadlineToDelete?.itemText}”? This action cannot be undone.
        </Typography>
      </ConfirmationDialog>
    </Dialog>
  );
}

function DeadlineCalendar({ deadlines, onSelectDate }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const deadlinesByDate = useMemo(() => groupDeadlinesByDate(deadlines), [deadlines]);
  const calendarDays = useMemo(() => {
    const first = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [selectedMonth]);
  const monthValue = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
  const moveMonth = amount => {
    setSelectedMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <Paper sx={{ ...cardSx, p: 1.5, overflowX: 'auto', height: '100%' }}>
      <SectionHeading
        icon={icons.calendar}
        title="My Calendar"
        subtitle="Select a date to view or add deadlines"
      />
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
        <Typography variant="h6">
          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AppIconButton
            icon={icons.previous}
            label="Previous month"
            onClick={() => moveMonth(-1)}
            tooltip={false}
          />
          <TextField
            label="Month and year"
            type="month"
            size="small"
            value={monthValue}
            onChange={event => {
              const [year, month] = event.target.value.split('-').map(Number);
              if (year && month) setSelectedMonth(new Date(year, month - 1, 1));
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 155, display: { xs: 'none', sm: 'block' } }}
          />
          <AppIconButton
            icon={icons.next}
            label="Next month"
            onClick={() => moveMonth(1)}
            tooltip={false}
          />
        </Stack>
      </Stack>
      <Box sx={{ minWidth: { xs: 520, md: 0 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Typography key={day} variant="caption" color="text.secondary" align="center" sx={{ py: 0.25, fontWeight: 500 }}>
              {day}
            </Typography>
          ))}
          {calendarDays.map(date => {
            const key = dateKey(date);
            const entries = deadlinesByDate[key] || [];
            const inMonth = date.getMonth() === selectedMonth.getMonth();
            const today = isDeadlineToday(date);
            return (
              <Box
                key={key}
                sx={{
                  position: 'relative',
                  minHeight: { xs: 38, sm: 40 },
                  minWidth: 0,
                  p: 0.25,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: inMonth ? 'background.paper' : 'background.subtle',
                  color: inMonth ? 'text.primary' : 'text.disabled',
                  textAlign: 'left',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="button"
                  type="button"
                  aria-label={`${entries.length ? `View ${entries.length} deadline${entries.length === 1 ? '' : 's'} or ` : ''}create deadline on ${date.toLocaleDateString()}`}
                  onClick={() => onSelectDate(date, entries)}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    width: '100%',
                    border: 0,
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:focus-visible': {
                      outline: '3px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: -3,
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    pointerEvents: 'none',
                    width: 22,
                    height: 22,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '50%',
                    bgcolor: today ? 'primary.main' : 'transparent',
                    color: today ? 'primary.contrastText' : 'inherit',
                    fontWeight: today ? 700 : 500,
                  }}
                >
                  {date.getDate()}
                </Box>
                <Stack
                  direction="row"
                  justifyContent="center"
                  spacing={0.35}
                  aria-hidden="true"
                  sx={{ position: 'relative', zIndex: 1, mt: 0.25, pointerEvents: 'none' }}
                >
                  {entries.slice(0, 3).map(deadline => (
                    <Box
                      key={`${deadline.projectID}-${deadline.actionItemID}`}
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        bgcolor: deadline.overdue ? 'error.main' : 'primary.main',
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}

function UpcomingDeadlinesTable({ deadlines, onSelectDeadline }) {
  return (
    <Paper sx={{ ...cardSx, p: 1.5, height: '100%', minWidth: 0 }}>
      <SectionHeading
        icon={icons.calendar}
        title="Upcoming Deadlines"
        subtitle="Remainder of this month and the next two"
      />
      {deadlines.length ? (
        <List disablePadding aria-label="Upcoming deadlines" sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {deadlines.map((deadline, index) => (
            <React.Fragment key={`${deadline.projectID}-${deadline.actionItemID}`}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => onSelectDeadline(deadline)}
                  sx={{ px: 0.5, py: 1.15, borderRadius: 1.5, alignItems: 'flex-start' }}
                >
                  <Box sx={{ minWidth: 52, mr: 1.25, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase' }}>
                      {deadline.dueDate.toLocaleDateString('en-US', { month: 'short' })}
                    </Typography>
                    <Typography variant="h6" sx={{ lineHeight: 1.05 }}>
                      {deadline.dueDate.getDate()}
                    </Typography>
                  </Box>
                  <ListItemText
                    primary={deadline.itemText}
                    secondary={deadline.workOrderName || deadline.projectName}
                    primaryTypographyProps={{ fontWeight: 600, noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
                    sx={{ minWidth: 0, my: 0 }}
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center', textAlign: 'center', px: 2 }}>
          <Box>
            <Box sx={{ color: 'text.disabled', display: 'flex', justifyContent: 'center', mb: 1 }}>
              <AppIcon icon={icons.calendar} size={ICON_SIZES.large} />
            </Box>
            <Typography color="text.secondary">
              No upcoming deadlines for this month or the next two.
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deadlineSelection, setDeadlineSelection] = useState(null);
  const {
    data,
    loading,
    error,
    query,
    setQuery,
    searchResults,
    searchReady,
    workQueue,
    deadlines,
    upcomingDeadlines,
    savingDeadline,
    deletingDeadline,
    deadlineMessage,
    saveDeadline,
    deleteDeadline,
    reload,
  } = useAdminDashboard();
  const myWorkOrders = useMemo(
    () => getMyWorkOrders(data.workOrders, user?.workerID),
    [data.workOrders, user?.workerID]
  );
  const myProjects = useMemo(
    () => getMyProjects(data.projects, user?.workerID),
    [data.projects, user?.workerID]
  );

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pb: 8 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" color="text.primary">Dashboard</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor active work, surface risks, and keep operations moving.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' } }}>
          <DashboardSearch
            query={query}
            onQueryChange={setQuery}
            groups={searchResults}
            searchReady={searchReady}
            onNavigate={navigate}
          />
          <DashboardAlerts items={workQueue} onNavigate={navigate} />
        </Stack>
      </Stack>

      {error && (
        <AppAlert severity="error" action={<Button color="inherit" size="small" onClick={reload}>Retry</Button>} sx={{ mb: 3 }}>
          {error}
        </AppAlert>
      )}
      {deadlineMessage && <AppAlert severity={deadlineMessage.severity} sx={{ mb: 3 }}>{deadlineMessage.text}</AppAlert>}

      {loading ? (
        <Paper sx={{ ...cardSx, minHeight: 300, display: 'grid', placeItems: 'center' }}>
          <Stack alignItems="center" spacing={1}>
            <CircularProgress size={34} />
            <Typography color="text.secondary">Loading operational overview…</Typography>
          </Stack>
        </Paper>
      ) : (
        <Stack spacing={3}>
          <OperationsOverview data={data} onNavigate={navigate} />
          <Box sx={{ ...dashboardContentGridSx, alignItems: 'stretch' }}>
            <ProjectOverviewTable projects={data.projects} onNavigate={navigate} />
            <Box sx={{ position: { xs: 'static', lg: 'relative' }, minHeight: 0 }}>
              <Stack
                spacing={3}
                sx={{
                  position: { xs: 'static', lg: 'absolute' },
                  inset: { lg: 0 },
                  height: { lg: '100%' },
                  minHeight: 0,
                }}
              >
                <QuickActions onNavigate={navigate} />
                <MyAssignmentsCard
                  workOrders={myWorkOrders}
                  myProjects={myProjects}
                  onNavigate={navigate}
                />
              </Stack>
            </Box>
          </Box>
          <Box sx={{ ...dashboardContentGridSx, alignItems: 'stretch' }}>
            <DeadlineCalendar
              deadlines={deadlines}
              onSelectDate={(date, dayDeadlines) => setDeadlineSelection({ date, deadlines: dayDeadlines })}
            />
            <UpcomingDeadlinesTable
              deadlines={upcomingDeadlines}
              onSelectDeadline={deadline => setDeadlineSelection({ deadline })}
            />
          </Box>
        </Stack>
      )}

      <DeadlineDialog
        open={Boolean(deadlineSelection)}
        projects={data.projects}
        saving={savingDeadline}
        deleting={deletingDeadline}
        initialSelection={deadlineSelection}
        onClose={() => setDeadlineSelection(null)}
        onSave={saveDeadline}
        onDelete={deleteDeadline}
      />
    </Box>
  );
}
