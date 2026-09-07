import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  ButtonGroup,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../api';
import { authService } from '../../services/authService';
import { formatDateTime, getWorkOrderWorkers, normalizeWorker, workerPayload } from '../../model';
import { useAuth } from '../../Components/AuthContext';
import { ConfirmationDialog } from '../../shared/components/dialogs';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { MetricSummary } from '../../shared/components/metrics';
import { BackNavigation } from '../../shared/components/navigation';
import { useConfirmationDialog } from '../../shared/hooks';
import WorkerTable from './components/WorkerTable';
import { WorkerCreatePanel, WorkerEditPanel } from './components/WorkerFormPanels';
import WorkerTeamSection from './components/WorkerTeamSection';
import { AppAlert, icons } from '../../shared/icons';

const emptyWorker = {
  firstName: '',
  lastName: '',
  displayName: '',
  username: '',
  email: '',
  roleTitle: '',
  roleDescription: '',
  password: '',
  confirmPassword: '',
  isAdmin: false,
};

const emptyTeam = {
  teamID: '',
  teamName: '',
  workerIDs: [],
};

const ManageWorkers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workerID: routeWorkerID } = useParams();
  const [workers, setWorkers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [view, setView] = useState('workers');
  const [workerID, setWorkerID] = useState(routeWorkerID || '');
  const [teamForm, setTeamForm] = useState(emptyTeam);
  const [teamSummary, setTeamSummary] = useState(null);
  const [createForm, setCreateForm] = useState(emptyWorker);
  const [editForm, setEditForm] = useState(emptyWorker);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const confirmationDialog = useConfirmationDialog();
  const pendingAction = confirmationDialog.target?.action;
  const pendingWorker = confirmationDialog.target?.worker;
  const showContextBack = Boolean(routeWorkerID);

  const fetchWorkers = useCallback(async () => {
    const [data, teamData, workOrderData] = await Promise.all([
      apiFetch('/workers'),
      apiFetch('/teams'),
      apiFetch('/workorders/all-with-archived'),
    ]);
    const normalizedWorkers = data
      .map(normalizeWorker)
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

    setWorkers(normalizedWorkers);
    setTeams(teamData);
    setWorkOrders(workOrderData);
  }, []);

  useEffect(() => {
    fetchWorkers().catch(error => setSnackbar({ open: true, message: error.message, severity: 'error' }));
  }, [fetchWorkers]);

  useEffect(() => {
    if (routeWorkerID) {
      setWorkerID(routeWorkerID);
    }
  }, [routeWorkerID]);

  const selectedWorker = useMemo(
    () => workers.find(worker => worker.workerID === Number(workerID)),
    [workers, workerID]
  );
  const attachedWorkOrders = useMemo(
    () => selectedWorker
      ? workOrders.filter(order =>
          getWorkOrderWorkers(order).some(worker => worker.workerID === selectedWorker.workerID)
        )
      : [],
    [selectedWorker, workOrders]
  );
  const visibleAttachedWorkOrders = useMemo(
    () => attachedWorkOrders.filter(order => !order.archived && order.status !== 'COMPLETE'),
    [attachedWorkOrders]
  );
  const canDeleteSelectedWorker = Boolean(selectedWorker && attachedWorkOrders.length === 0);
  const selectedTeam = useMemo(
    () => teams.find(team => team.teamID === Number(teamForm.teamID)),
    [teams, teamForm.teamID]
  );
  const activeWorkers = useMemo(() => workers.filter(worker => !worker.archived), [workers]);
  const assignedWorkerCount = useMemo(() => {
    const activeWorkerIDs = new Set(activeWorkers.map(worker => worker.workerID));
    return new Set(
      workOrders
        .filter(order => !order.archived && order.status !== 'COMPLETE')
        .flatMap(getWorkOrderWorkers)
        .map(worker => worker.workerID)
        .filter(id => activeWorkerIDs.has(id)),
    ).size;
  }, [activeWorkers, workOrders]);
  const workerMetrics = [
    { label: 'Active Workers', value: activeWorkers.length, detail: 'Currently active', icon: icons.workers },
    { label: 'Administrators', value: activeWorkers.filter(worker => worker.isAdmin).length, detail: 'Admin access', icon: icons.settings },
    { label: 'Teams', value: teams.length, detail: 'Active teams', icon: icons.assignments },
    { label: 'Assigned to Work', value: assignedWorkerCount, detail: 'Across live work orders', icon: icons.workOrders },
  ];

  useEffect(() => {
    if (selectedWorker) {
      setEditForm({
        firstName: selectedWorker.firstName || '',
        lastName: selectedWorker.lastName || '',
        displayName: selectedWorker.displayName || '',
        username: selectedWorker.username || '',
        email: selectedWorker.email || '',
        roleTitle: selectedWorker.roleTitle || '',
        roleDescription: selectedWorker.roleDescription || '',
        password: '',
        confirmPassword: '',
        isAdmin: selectedWorker.isAdmin || false,
      });
    } else {
      setEditForm(emptyWorker);
    }

  }, [selectedWorker]);

  const handleCreateChange = (event) => {
    const { name, value, checked, type } = event.target;
    setCreateForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm(current => ({ ...current, [name]: value }));
  };

  const resetTeamForm = () => setTeamForm(emptyTeam);

  const saveTeam = async (event) => {
    event?.preventDefault?.();
    if (!teamForm.teamName.trim() || !teamForm.workerIDs.length) {
      showMessage('Team name and workers are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      await apiFetch(teamForm.teamID ? `/teams/${teamForm.teamID}` : '/teams', {
        method: teamForm.teamID ? 'PUT' : 'POST',
        body: JSON.stringify({
          teamName: teamForm.teamName.trim(),
          workerIDs: teamForm.workerIDs.map(Number),
        }),
      });
      resetTeamForm();
      await fetchWorkers();
      showMessage('Team saved successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const loadTeamIntoForm = (team) => {
    setTeamForm({
      teamID: team.teamID,
      teamName: team.teamName || '',
      workerIDs: (team.workers || []).map(worker => worker.workerID),
    });
  };

  const selectTeam = (teamID) => {
    const team = teams.find(item => item.teamID === Number(teamID));
    team ? loadTeamIntoForm(team) : resetTeamForm();
  };

  const deleteTeam = async (team) => {
    if (!team || !window.confirm(`Delete ${team.teamName || `team #${team.teamID}`}?`)) return;

    setSaving(true);
    try {
      await apiFetch(`/teams/${team.teamID}`, { method: 'DELETE' });
      if (Number(teamForm.teamID) === team.teamID) resetTeamForm();
      await fetchWorkers();
      showMessage('Team deleted successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const requestPassword = (action, worker = null) => {
    setPassword('');
    confirmationDialog.openDialog({ action, worker });
  };

  const closePasswordDialog = () => {
    setPassword('');
    confirmationDialog.closeDialog();
  };

  const verifyPassword = () => authService.verifyPassword({ username: user.username, password });

  const createWorker = async (event) => {
    event?.preventDefault?.();

    if (createForm.password !== createForm.confirmPassword) {
      showMessage('Passwords do not match.', 'error');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/workers', {
        method: 'POST',
        body: JSON.stringify(workerPayload({
          ...createForm,
          admin: createForm.isAdmin,
        })),
      });
      setCreateForm(emptyWorker);
      await fetchWorkers();
      showMessage('Worker created successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateWorker = async () => {
    if (!selectedWorker) return;

    setSaving(true);
    try {
      await verifyPassword();
      await apiFetch(`/workers/${selectedWorker.workerID}`, {
        method: 'PUT',
        body: JSON.stringify({
          workerFName: editForm.firstName,
          workerLName: editForm.lastName,
          workerDisplayName: editForm.displayName,
          workerUser: editForm.username,
          workerEmail: editForm.email,
          roleTitle: editForm.roleTitle,
          roleDescription: editForm.roleDescription,
          admin: editForm.isAdmin,
        }),
      });
      await fetchWorkers();
      closePasswordDialog();
      showMessage('Worker updated successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const archiveWorker = async (worker) => {
    if (!worker) return;
    if (!window.confirm(`Archive ${worker.firstName} ${worker.lastName}?`)) {
      closePasswordDialog();
      return;
    }

    setSaving(true);
    try {
      await apiFetch(`/workers/${worker.workerID}`, { method: 'DELETE' });
      if (Number(workerID) === worker.workerID) {
        setWorkerID('');
      }
      await fetchWorkers();
      showMessage('Worker archived successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteWorker = async () => {
    if (!selectedWorker || !canDeleteSelectedWorker) return;

    setSaving(true);
    try {
      await verifyPassword();
      await apiFetch(`/workers/${selectedWorker.workerID}/permanent`, { method: 'DELETE' });
      setWorkerID('');
      await fetchWorkers();
      closePasswordDialog();
      showMessage('Worker permanently deleted.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const runPendingAction = () => {
    if (pendingAction === 'create') {
      createWorker();
      return;
    }
    if (pendingAction === 'update') {
      updateWorker();
      return;
    }
    if (pendingAction === 'archive') {
      archiveWorker(pendingWorker);
      return;
    }
    if (pendingAction === 'delete') {
      deleteWorker();
    }
  };

  return (
    <PageContainer>
      <PageHeader
        context={showContextBack ? <BackNavigation fallback="/admin/workers" /> : null}
        title="Workers"
        subtitle="Create and edit active workers and teams."
      />
      <PageSections>
        <ButtonGroup variant="outlined" aria-label="Manage workers view" sx={{ alignSelf: 'flex-start' }}>
          <Button variant={view === 'workers' ? 'contained' : 'outlined'} onClick={() => setView('workers')}>
            Workers
          </Button>
          <Button variant={view === 'teams' ? 'contained' : 'outlined'} onClick={() => setView('teams')}>
            Teams
          </Button>
        </ButtonGroup>

        <MetricSummary metrics={workerMetrics} ariaLabel="Worker summary" />

        {view === 'workers' && (
          <Grid container spacing={3} alignItems="stretch">
            <WorkerCreatePanel
              form={createForm}
              saving={saving}
              onChange={handleCreateChange}
              onSubmit={createWorker}
            />
            <WorkerEditPanel
              workers={workers}
              workerID={workerID}
              form={editForm}
              selectedWorker={selectedWorker}
              attachedWorkOrders={visibleAttachedWorkOrders}
              canDelete={canDeleteSelectedWorker}
              saving={saving}
              onWorkerChange={setWorkerID}
              onChange={handleEditChange}
              onUpdate={() => requestPassword('update')}
              onDelete={() => requestPassword('delete')}
              onOpenWorkOrder={order => navigate(`/admin/workorders/${order.workOrderID}`)}
            />
            <WorkerTable
              workers={workers}
              saving={saving}
              onView={worker => navigate(`/admin/workers/${worker.workerID}`)}
              onArchive={archiveWorker}
            />
          </Grid>
        )}

        {view === 'teams' && (
          <WorkerTeamSection
            teams={teams}
            workers={workers}
            teamForm={teamForm}
            selectedTeam={selectedTeam}
            saving={saving}
            onSelectTeam={selectTeam}
            onFormChange={changes => setTeamForm(current => ({ ...current, ...changes }))}
            onReset={resetTeamForm}
            onSave={saveTeam}
            onDelete={deleteTeam}
            onShowSummary={setTeamSummary}
          />
        )}
      </PageSections>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(current => ({ ...current, open: false }))}>
        <AppAlert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</AppAlert>
      </Snackbar>

      <ConfirmationDialog
        open={confirmationDialog.open}
        title={pendingAction === 'delete' ? 'Delete Worker' : 'Confirm Changes'}
        confirmLabel={pendingAction === 'delete' ? 'Delete' : 'Confirm'}
        confirmColor={pendingAction === 'delete' ? 'error' : 'primary'}
        onConfirm={runPendingAction}
        onCancel={closePasswordDialog}
        disabled={!password}
        loading={saving}
      >
          {pendingAction === 'delete' && (
            <AppAlert severity="warning" sx={{ mb: 2 }}>
              This permanently deletes a worker with no attached work orders and cannot be undone.
            </AppAlert>
          )}
          <TextField
            label="Enter your password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            fullWidth
            margin="normal"
          />
      </ConfirmationDialog>

      <Dialog open={Boolean(teamSummary)} onClose={() => setTeamSummary(null)} fullWidth maxWidth="sm">
        <DialogTitle>{teamSummary?.teamName || 'Team Summary'}</DialogTitle>
        <DialogContent dividers>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, width: 180 }}>Team ID</TableCell>
                  <TableCell>{teamSummary?.teamID || 'Not set'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Team Name</TableCell>
                  <TableCell>{teamSummary?.teamName || 'Not set'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Worker IDs</TableCell>
                  <TableCell>{(teamSummary?.workers || []).map(worker => normalizeWorker(worker).workerID).join(', ') || 'None'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Project Started</TableCell>
                  <TableCell>{formatDateTime(teamSummary?.projectStartedAt)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Workers</Typography>
          <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
            {(teamSummary?.workers || []).map(worker => {
              const normalized = normalizeWorker(worker);
              return <Chip key={normalized.workerID} label={`${normalized.firstName} ${normalized.lastName}`} />;
            })}
            {!(teamSummary?.workers || []).length && <Typography color="text.secondary">No workers on this team.</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamSummary(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ManageWorkers;
