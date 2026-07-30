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
import { formatMoney } from '../../../model';
import {
  AppAlert,
  AppIcon,
  AppIconButton,
  ICON_SIZES,
  icons,
} from '../../../shared/icons';
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
  boxShadow: '0 8px 24px rgba(21, 49, 71, 0.05)',
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

function SectionHeading({ icon, iconColor = 'primary.main', title, subtitle, action }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon && (
            <Box component="span" sx={{ color: iconColor, display: 'inline-flex' }}>
              <AppIcon icon={icon} />
            </Box>
          )}
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
            <Box sx={{ p: 1, borderRadius: 2, color: '#153147', bgcolor: '#e8f0f5', display: 'flex' }}>
              <AppIcon icon={card.icon} size={22} />
            </Box>
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
        icon={icons.projects}
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
                      fontWeight: 650,
                      textTransform: 'none',
                    }}
                  >
                    {project.projectName || `Project #${project.projectID}`}
                  </Button>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={(project.projectStatus || 'OPEN').replaceAll('_', ' ')} />
                </TableCell>
                <TableCell><HealthProgress health={getProjectHealth(project)} /></TableCell>
                <TableCell><BudgetHealth health={getBudgetHealth(project)} /></TableCell>
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

function WorkQueue({ items, onNavigate }) {
  return (
    <Paper sx={{ ...cardSx, p: 2 }}>
      <SectionHeading icon={icons.warning} iconColor="warning.main" title="Needs Attention" subtitle="Actionable operational exceptions" />
      {items.length ? (
        <List disablePadding>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => onNavigate(item.path)} sx={{ px: 0.5, py: 0.35, borderRadius: 2 }}>
                  <ListItemText primary={item.label} secondary={DASHBOARD_SEVERITY[item.severity].label} />
                  <Chip label={item.count} size="small" color={DASHBOARD_SEVERITY[item.severity].color} />
                  <Box component="span" sx={{ color: 'action.active', display: 'inline-flex', ml: 0.5 }}>
                    <AppIcon icon={icons.disclosure} size={ICON_SIZES.compact} />
                  </Box>
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
    { label: 'Create Project', icon: icons.projects, path: '/admin/projects/active', primary: true },
    { label: 'Create Work Order', icon: icons.workOrders, path: '/admin/manage-workorders' },
    { label: 'Add Company', icon: icons.companies, path: '/admin/manage-companies' },
    { label: 'Add Worker', icon: icons.addWorker, path: '/admin/manage-workers' },
  ];
  return (
    <Paper sx={{ ...cardSx, p: 2 }}>
      <SectionHeading title="Quick Actions" subtitle="Start common administrative work" />
      <Stack spacing={1}>
        {actions.map(action => (
          <Button
            key={action.label}
            variant={action.primary ? 'contained' : 'outlined'}
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

function DeadlineDialog({ open, projects, saving, initialSelection, onClose, onSave }) {
  const [project, setProject] = useState(null);
  const [actionItem, setActionItem] = useState(null);
  const [itemText, setItemText] = useState('');
  const [dueDate, setDueDate] = useState('');
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Deadlines on {formatDueDate(initialSelection.date)}
            </Typography>
            <List dense disablePadding aria-label="Deadlines on selected date">
              {selectedDayDeadlines.map(deadline => (
                <ListItem key={`${deadline.projectID}-${deadline.actionItemID}`} disablePadding>
                  <ListItemButton onClick={() => selectDeadline(deadline)} sx={{ borderRadius: 1.5 }}>
                    <ListItemText primary={deadline.itemText} secondary={deadline.projectName} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ mt: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Select a deadline to edit it, or complete the form below to add another.
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
        title="Deadline Calendar"
        subtitle="Select a date to view or add deadlines"
      />
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
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
            <Typography key={day} variant="caption" color="text.secondary" align="center" sx={{ py: 0.25, fontWeight: 700 }}>
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
                  bgcolor: inMonth ? 'background.paper' : 'action.hover',
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
                    '&:hover': { bgcolor: 'action.selected' },
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
                    <Typography variant="h6" sx={{ lineHeight: 1.05, fontWeight: 750 }}>
                      {deadline.dueDate.getDate()}
                    </Typography>
                  </Box>
                  <ListItemText
                    primary={deadline.itemText}
                    secondary={deadline.workOrderName || deadline.projectName}
                    primaryTypographyProps={{ fontWeight: 650, noWrap: true }}
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
    deadlineMessage,
    saveDeadline,
    reload,
  } = useAdminDashboard();

  return (
    <Box sx={{ maxWidth: 1500, mx: 'auto', pb: 8 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 750, color: '#153147' }}>Dashboard</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor active work, surface risks, and keep operations moving.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <AppAlert severity="error" action={<Button color="inherit" size="small" onClick={reload}>Retry</Button>} sx={{ mb: 3 }}>
          {error}
        </AppAlert>
      )}
      {deadlineMessage && <AppAlert severity={deadlineMessage.severity} sx={{ mb: 3 }}>{deadlineMessage.text}</AppAlert>}

      <Box sx={{ mb: 3 }}>
        <DashboardSearch
          query={query}
          onQueryChange={setQuery}
          groups={searchResults}
          searchReady={searchReady}
          onNavigate={navigate}
        />
      </Box>

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
          <Box sx={dashboardContentGridSx}>
            <ProjectOverviewTable projects={data.projects} onNavigate={navigate} />
            <Stack spacing={3}>
              <QuickActions onNavigate={navigate} />
              <WorkQueue items={workQueue} onNavigate={navigate} />
            </Stack>
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
        initialSelection={deadlineSelection}
        onClose={() => setDeadlineSelection(null)}
        onSave={saveDeadline}
      />
    </Box>
  );
}
