import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import {
  AddBusinessOutlined,
  AssignmentOutlined,
  BusinessOutlined,
  CalendarMonthOutlined,
  ChevronRight,
  EngineeringOutlined,
  FolderOutlined,
  NotificationsNoneOutlined,
  PersonAddAltOutlined,
  Search,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, formatMoney } from '../../../model';
import useAdminDashboard from './useAdminDashboard';
import { DASHBOARD_SEVERITY, getBudgetHealth, getProjectHealth } from './dashboardUtils';

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 8px 24px rgba(21, 49, 71, 0.05)',
  bgcolor: 'background.paper',
};

const formatDueDate = value => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(value));

function SectionHeading({ icon, title, subtitle, action }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>{title}</Typography>
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
    <Box sx={{ position: 'relative', width: { xs: '100%', md: 520 }, zIndex: 5 }}>
      <TextField
        value={query}
        onChange={event => onQueryChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={event => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setFocused(false);
        }}
        label="Search projects, work orders, companies, and workers"
        placeholder="Search by name, ID, email, or description"
        fullWidth
        inputProps={{ 'aria-controls': open ? 'dashboard-search-results' : undefined }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
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
                    <ChevronRight fontSize="small" color="action" />
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

function OperationsOverview({ data, onNavigate }) {
  const cards = [
    {
      label: 'Projects',
      value: data.projects.length,
      detail: `${data.projects.filter(item => item.projectStatus === 'IN_REVIEW').length} awaiting review`,
      icon: <FolderOutlined />,
      path: '/admin/projects/active',
    },
    {
      label: 'Work Orders',
      value: data.workOrders.length,
      detail: `${data.workOrders.filter(item => item.status === 'IN_PROCESS').length} in process`,
      icon: <AssignmentOutlined />,
      path: '/admin/workorders',
    },
    {
      label: 'Companies',
      value: data.companies.length,
      detail: 'Active companies',
      icon: <BusinessOutlined />,
      path: '/admin/companies',
    },
    {
      label: 'Workers',
      value: data.workers.length,
      detail: `${data.workers.filter(worker => !worker.archived).length} active`,
      icon: <EngineeringOutlined />,
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
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 28px rgba(21, 49, 71, 0.1)' },
            '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.light', outlineOffset: 2 },
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="text.secondary" variant="body2">{card.label}</Typography>
              <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 750, color: '#153147' }}>{card.value}</Typography>
              <Typography variant="caption" color="text.secondary">{card.detail}</Typography>
            </Box>
            <Box sx={{ p: 1, borderRadius: 2, color: '#153147', bgcolor: '#e8f0f5', display: 'flex' }}>{card.icon}</Box>
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}

function HealthProgress({ health }) {
  if (!health.configured) {
    return <Typography variant="body2" color="text.secondary">{health.label}</Typography>;
  }
  return (
    <Box sx={{ minWidth: 145 }}>
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <Typography variant="body2">{health.percent}%</Typography>
        <Typography variant="caption" color="text.secondary">{health.label}</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={health.percent}
        aria-label={`Project completion ${health.percent} percent, ${health.label}`}
        sx={{ mt: 0.75, height: 7, borderRadius: 99 }}
      />
    </Box>
  );
}

function BudgetHealth({ health }) {
  if (!health.configured) return <Chip size="small" variant="outlined" label={health.label} />;
  return (
    <Box sx={{ minWidth: 150 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography variant="body2">{health.percent}% used</Typography>
        <Chip size="small" color={health.severity} variant="outlined" label={health.label} />
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {formatMoney(health.spent)} of {formatMoney(health.budget)}
      </Typography>
    </Box>
  );
}

function ProjectOverviewTable({ projects, onNavigate }) {
  return (
    <Paper sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, overflow: 'hidden' }}>
      <SectionHeading
        icon={<FolderOutlined color="primary" />}
        title="Project Overview"
        subtitle="Completion and budget signals for active projects"
        action={<Button size="small" onClick={() => onNavigate('/admin/projects/active')}>View all</Button>}
      />
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="Project health overview">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Project Health</TableCell>
              <TableCell>Budget Health</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.slice(0, 8).map(project => (
              <TableRow key={project.projectID} hover>
                <TableCell sx={{ minWidth: 180, fontWeight: 600 }}>
                  {project.projectName || `Project #${project.projectID}`}
                </TableCell>
                <TableCell>
                  <Chip size="small" label={(project.projectStatus || 'OPEN').replaceAll('_', ' ')} />
                </TableCell>
                <TableCell><HealthProgress health={getProjectHealth(project)} /></TableCell>
                <TableCell><BudgetHealth health={getBudgetHealth(project)} /></TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(project.lastModifiedAt)}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => onNavigate(`/admin/projects/${project.projectID}`)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
            {!projects.length && (
              <TableRow>
                <TableCell colSpan={6}>
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

function WorkQueue({ items, onNavigate }) {
  return (
    <Paper sx={{ ...cardSx, p: 2.5 }}>
      <SectionHeading icon={<WarningAmberOutlined color="warning" />} title="Needs Attention" subtitle="Actionable operational exceptions" />
      {items.length ? (
        <List disablePadding>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => onNavigate(item.path)} sx={{ px: 0.5, borderRadius: 2 }}>
                  <ListItemText primary={item.label} secondary={DASHBOARD_SEVERITY[item.severity].label} />
                  <Chip label={item.count} size="small" color={DASHBOARD_SEVERITY[item.severity].color} />
                  <ChevronRight fontSize="small" color="action" sx={{ ml: 0.5 }} />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No operational exceptions require attention.
        </Typography>
      )}
    </Paper>
  );
}

function QuickActions({ onNavigate }) {
  const actions = [
    { label: 'Create Project', icon: <FolderOutlined />, path: '/admin/projects/active', primary: true },
    { label: 'Create Work Order', icon: <AssignmentOutlined />, path: '/admin/manage-workorders' },
    { label: 'Add Company', icon: <AddBusinessOutlined />, path: '/admin/manage-companies' },
    { label: 'Add Worker', icon: <PersonAddAltOutlined />, path: '/admin/manage-workers' },
  ];
  return (
    <Paper sx={{ ...cardSx, p: 2.5 }}>
      <SectionHeading title="Quick Actions" subtitle="Start common administrative work" />
      <Stack spacing={1}>
        {actions.map(action => (
          <Button
            key={action.label}
            variant={action.primary ? 'contained' : 'outlined'}
            startIcon={action.icon}
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

function DeadlineDialog({ open, projects, saving, onClose, onSave }) {
  const [project, setProject] = useState(null);
  const [actionItem, setActionItem] = useState(null);
  const [itemText, setItemText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const availableItems = useMemo(() => (project?.actionItems || []).filter(item => !item.completed), [project]);

  useEffect(() => {
    if (!open) {
      setProject(null);
      setActionItem(null);
      setItemText('');
      setDueDate('');
    }
  }, [open]);

  const selectActionItem = item => {
    setActionItem(item);
    setItemText(item?.itemText || '');
    setDueDate(item?.dueDate ? String(item.dueDate).slice(0, 10) : '');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create or edit a project deadline</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Community Edition deadlines are stored on project action items.
        </Alert>
        <Autocomplete
          options={projects.filter(item => item.projectStatus !== 'COMPLETE')}
          getOptionLabel={option => option.projectName || `Project #${option.projectID}`}
          value={project}
          onChange={(_, value) => { setProject(value); selectActionItem(null); }}
          renderInput={params => <TextField {...params} label="Project" margin="normal" required />}
        />
        <Autocomplete
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
    </Dialog>
  );
}

function UpcomingDeadlines({ deadlines, onNavigate, onAdd }) {
  return (
    <Paper sx={{ ...cardSx, p: 2.5 }}>
      <SectionHeading
        icon={<CalendarMonthOutlined color="primary" />}
        title="Upcoming Deadlines"
        subtitle="Project action items ordered by due date"
        action={<Button size="small" onClick={onAdd}>Manage</Button>}
      />
      {deadlines.length ? (
        <List disablePadding>
          {deadlines.slice(0, 6).map((deadline, index) => (
            <React.Fragment key={`${deadline.projectID}-${deadline.actionItemID}`}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => onNavigate(deadline.path)} sx={{ px: 0.5, borderRadius: 2 }}>
                  <ListItemText
                    primary={deadline.itemText}
                    secondary={`${deadline.projectName} • ${formatDueDate(deadline.dueDate)}`}
                  />
                  <Chip
                    size="small"
                    color={deadline.overdue ? 'error' : deadline.daysUntil <= 7 ? 'warning' : 'default'}
                    label={deadline.overdue ? 'Overdue' : deadline.daysUntil === 0 ? 'Due today' : `${deadline.daysUntil} days`}
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No upcoming project deadlines are configured.
        </Typography>
      )}
    </Paper>
  );
}

function Notifications({ notifications, onNavigate }) {
  return (
    <Paper sx={{ ...cardSx, p: 2.5 }}>
      <SectionHeading
        icon={<NotificationsNoneOutlined color="primary" />}
        title="Notifications"
        subtitle="Deadline and budget alerts"
      />
      {notifications.length ? (
        <List disablePadding>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => onNavigate(notification.path)} sx={{ px: 0.5, borderRadius: 2 }}>
                  <ListItemText
                    primary={notification.message}
                    secondary={`${notification.entity}${notification.date ? ` • ${formatDueDate(notification.date)}` : ''}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    color={DASHBOARD_SEVERITY[notification.severity].color}
                    label={DASHBOARD_SEVERITY[notification.severity].label}
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No urgent operational notifications.
        </Typography>
      )}
    </Paper>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
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
    notifications,
    savingDeadline,
    deadlineMessage,
    saveDeadline,
    reload,
  } = useAdminDashboard();

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pb: 8 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', lg: 'flex-end' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 750, color: '#153147' }}>Dashboard</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor active work, surface risks, and keep operations moving.
          </Typography>
        </Box>
        <DashboardSearch
          query={query}
          onQueryChange={setQuery}
          groups={searchResults}
          searchReady={searchReady}
          onNavigate={navigate}
        />
      </Stack>

      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={reload}>Retry</Button>} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {deadlineMessage && <Alert severity={deadlineMessage.severity} sx={{ mb: 3 }}>{deadlineMessage.text}</Alert>}

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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 2fr) minmax(300px, 1fr)' }, gap: 3 }}>
            <ProjectOverviewTable projects={data.projects} onNavigate={navigate} />
            <Stack spacing={3}>
              <WorkQueue items={workQueue} onNavigate={navigate} />
              <QuickActions onNavigate={navigate} />
            </Stack>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            <UpcomingDeadlines deadlines={deadlines} onNavigate={navigate} onAdd={() => setDeadlineDialogOpen(true)} />
            <Notifications notifications={notifications} onNavigate={navigate} />
          </Box>
        </Stack>
      )}

      <DeadlineDialog
        open={deadlineDialogOpen}
        projects={data.projects}
        saving={savingDeadline}
        onClose={() => setDeadlineDialogOpen(false)}
        onSave={saveDeadline}
      />
    </Box>
  );
}
