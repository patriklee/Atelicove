import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
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
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers, normalizeWorker, workerPayload } from '../model';
import { useAuth } from './AuthContext';
import TableTitleRow from './TableTitleRow';

const emptyWorker = {
  firstName: '',
  lastName: '',
  displayName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  isAdmin: false,
};

const WorkerFields = ({ form, onChange, mode }) => (
  <>
    <TextField label="First Name" name="firstName" value={form.firstName} onChange={onChange} fullWidth margin="normal" />
    <TextField label="Last Name" name="lastName" value={form.lastName} onChange={onChange} fullWidth margin="normal" />
    <TextField label="Display Name" name="displayName" value={form.displayName} onChange={onChange} fullWidth margin="normal" />
    <TextField label="Username" name="username" value={form.username} onChange={onChange} fullWidth margin="normal" disabled={mode === 'edit'} />
    <TextField label="Email" name="email" type="email" value={form.email} onChange={onChange} fullWidth margin="normal" />
    {mode === 'create' && (
      <FormControlLabel
        control={<Checkbox name="isAdmin" checked={form.isAdmin} onChange={onChange} />}
        label="Admin"
      />
    )}
  </>
);

const ManageWorkers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workerID: routeWorkerID } = useParams();
  const [workers, setWorkers] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [workerID, setWorkerID] = useState(routeWorkerID || '');
  const [createForm, setCreateForm] = useState(emptyWorker);
  const [editForm, setEditForm] = useState(emptyWorker);
  const [password, setPassword] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingWorker, setPendingWorker] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchWorkers = useCallback(async () => {
    const [data, workOrderData] = await Promise.all([
      apiFetch('/workers'),
      apiFetch('/workorders/all-with-archived'),
    ]);
    const normalizedWorkers = data
      .map(normalizeWorker)
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

    setWorkers(normalizedWorkers);
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

  useEffect(() => {
    if (selectedWorker) {
      setEditForm({
        firstName: selectedWorker.firstName || '',
        lastName: selectedWorker.lastName || '',
        displayName: selectedWorker.displayName || '',
        username: selectedWorker.username || '',
        email: selectedWorker.email || '',
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

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const requestPassword = (action, worker = null) => {
    setPendingAction(action);
    setPendingWorker(worker);
    setPassword('');
    setPasswordOpen(true);
  };

  const closePasswordDialog = () => {
    setPasswordOpen(false);
    setPassword('');
    setPendingAction(null);
    setPendingWorker(null);
  };

  const verifyPassword = () => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: user.username, password }),
  });

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
    <Box sx={{ p: 3, pb: 8 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Worker</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Create and edit active workers.</Typography>

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={6}>
          <Paper component="form" onSubmit={createWorker} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" align="left" sx={{ fontWeight: 600, mb: 2 }}>Create Worker</Typography>

            <WorkerFields form={createForm} onChange={handleCreateChange} mode="create" />

            <TextField label="Password" name="password" type="password" value={createForm.password} onChange={handleCreateChange} fullWidth margin="normal" />
            <TextField label="Confirm Password" name="confirmPassword" type="password" value={createForm.confirmPassword} onChange={handleCreateChange} fullWidth margin="normal" />

            <Button
              type="submit"
              variant="contained"
              disabled={
                saving ||
                !createForm.firstName.trim() ||
                !createForm.lastName.trim() ||
                !createForm.username.trim() ||
                !createForm.email.trim() ||
                createForm.password.length < 8 ||
                !createForm.confirmPassword
              }
              sx={{ mt: 2 }}
            >
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" align="left" sx={{ fontWeight: 600, mb: 2 }}>Edit Worker</Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Worker</InputLabel>
              <Select value={workerID} label="Worker" onChange={event => setWorkerID(event.target.value)}>
                <MenuItem value="">No worker selected</MenuItem>
                {workers.filter(worker => !worker.isAdmin).map(worker => (
                  <MenuItem key={worker.workerID} value={worker.workerID}>
                    {worker.firstName} {worker.lastName}{worker.isAdmin ? ' (Admin)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <WorkerFields form={editForm} onChange={handleEditChange} mode="edit" />

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                disabled={saving || !selectedWorker || !editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()}
                onClick={() => requestPassword('update')}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={saving || !canDeleteSelectedWorker}
                onClick={() => requestPassword('delete')}
              >
                Delete
              </Button>
            </Stack>

            {selectedWorker && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Associated Work Orders</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {visibleAttachedWorkOrders.length ? visibleAttachedWorkOrders.map(order => (
                    <Chip
                      key={order.workOrderID}
                      label={`#${order.workOrderID} (${order.status?.replaceAll('_', ' ')})`}
                      onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}
                      clickable
                    />
                  )) : <Chip label="No active open work orders" />}
                </Stack>
              </Box>
            )}

          </Paper>
        </Grid>

        <Grid item xs={12} sx={{ mt: 6 }}>
          <Paper sx={{ p: 3 }}>
            <TableContainer sx={{ maxHeight: 360, overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableTitleRow title="Workers" colSpan={7} />
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workers.map(worker => (
                    <TableRow key={worker.workerID}>
                      <TableCell>
                        <Button size="small" onClick={() => navigate(`/admin/workers/${worker.workerID}`)}>
                          {worker.firstName} {worker.lastName}
                        </Button>
                      </TableCell>
                      <TableCell>{worker.username}</TableCell>
                      <TableCell>{worker.email}</TableCell>
                      <TableCell>{worker.isAdmin ? 'Admin' : 'Worker'}</TableCell>
                      <TableCell>{formatDateTime(worker.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(worker.lastModifiedAt)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" color="warning" disabled={saving} onClick={() => archiveWorker(worker)}>
                          Archive
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!workers.length && (
                    <TableRow>
                      <TableCell colSpan={7}>No workers found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(current => ({ ...current, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      <Dialog open={passwordOpen} onClose={closePasswordDialog} fullWidth maxWidth="xs">
        <DialogTitle>{pendingAction === 'delete' ? 'Delete Worker' : 'Confirm Changes'}</DialogTitle>
        <DialogContent>
          {pendingAction === 'delete' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This permanently deletes a worker with no attached work orders and cannot be undone.
            </Alert>
          )}
          <TextField
            label="Enter your password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePasswordDialog}>Cancel</Button>
          <Button
            variant="contained"
            color={pendingAction === 'delete' ? 'error' : 'primary'}
            disabled={!password || saving}
            onClick={runPendingAction}
          >
            {pendingAction === 'delete' ? 'Delete' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageWorkers;
