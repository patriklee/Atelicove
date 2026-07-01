import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
import { useAuth } from './AuthContext';
import { formatDateTime } from '../model';

const emptyCompany = {
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
};

const CompanyFields = ({ form, onChange, disabled = false }) => (
  <>
    <TextField label="Company Name" name="companyName" value={form.companyName} onChange={onChange} fullWidth margin="normal" disabled={disabled} />
    <TextField label="Address" name="companyAddress" value={form.companyAddress} onChange={onChange} fullWidth margin="normal" disabled={disabled} />
    <TextField label="Phone Number" name="companyPhone" value={form.companyPhone} onChange={onChange} fullWidth margin="normal" disabled={disabled} />
    <TextField label="Email" name="companyEmail" value={form.companyEmail} onChange={onChange} fullWidth margin="normal" disabled={disabled} />
  </>
);

const ManageCompanies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyID: routeCompanyID } = useParams();
  const [companies, setCompanies] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [companyID, setCompanyID] = useState(routeCompanyID || '');
  const [createForm, setCreateForm] = useState(emptyCompany);
  const [editForm, setEditForm] = useState(emptyCompany);
  const [password, setPassword] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingCompany, setPendingCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    const [companyData, workOrderData] = await Promise.all([
      apiFetch('/companies/all'),
      apiFetch('/workorders/all-with-archived'),
    ]);

    setCompanies(companyData.sort((a, b) => a.companyName.localeCompare(b.companyName)));
    setWorkOrders(workOrderData);
  }, []);

  useEffect(() => {
    loadData().catch(error => {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    });
  }, [loadData]);

  useEffect(() => {
    if (routeCompanyID) {
      setCompanyID(routeCompanyID);
    }
  }, [routeCompanyID]);

  const selectedCompany = useMemo(
    () => companies.find(company => company.companyID === Number(companyID)),
    [companies, companyID]
  );

  const attachedWorkOrders = useMemo(
    () => selectedCompany
      ? workOrders.filter(order => order.company?.companyID === selectedCompany.companyID)
      : [],
    [selectedCompany, workOrders]
  );
  const canDeleteSelectedCompany = Boolean(selectedCompany && attachedWorkOrders.length === 0);

  useEffect(() => {
    if (selectedCompany) {
      setEditForm({
        companyName: selectedCompany.companyName || '',
        companyAddress: selectedCompany.companyAddress || '',
        companyPhone: selectedCompany.companyPhone || '',
        companyEmail: selectedCompany.companyEmail || '',
      });
    } else {
      setEditForm(emptyCompany);
    }
  }, [selectedCompany]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm(current => ({ ...current, [name]: value }));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm(current => ({ ...current, [name]: value }));
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const requestPassword = (action, company = null) => {
    setPendingAction(action);
    setPendingCompany(company);
    setPassword('');
    setPasswordOpen(true);
  };

  const closePasswordDialog = () => {
    setPasswordOpen(false);
    setPassword('');
    setPendingAction(null);
    setPendingCompany(null);
  };

  const verifyPassword = () => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: user.username, password }),
  });

  const createCompany = async (event) => {
    event?.preventDefault?.();
    setSaving(true);

    try {
      const created = await apiFetch('/companies/add', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      setCreateForm(emptyCompany);
      setCompanyID(String(created.companyID));
      await loadData();
      showMessage('Company created successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateCompany = async () => {
    if (!selectedCompany) return;

    setSaving(true);
    try {
      await verifyPassword();
      await apiFetch(`/companies/${selectedCompany.companyID}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      await loadData();
      closePasswordDialog();
      showMessage('Company updated successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const archiveCompany = async (company) => {
    if (!company || !window.confirm(`Archive ${company.companyName}?`)) return;

    setSaving(true);
    try {
      await apiFetch(`/companies/${company.companyID}`, { method: 'DELETE' });
      if (Number(companyID) === company.companyID) {
        setCompanyID('');
      }
      await loadData();
      showMessage('Company archived successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async () => {
    if (!selectedCompany || !canDeleteSelectedCompany) return;

    setSaving(true);
    try {
      await verifyPassword();
      await apiFetch(`/companies/${selectedCompany.companyID}/permanent`, { method: 'DELETE' });
      setCompanyID('');
      await loadData();
      closePasswordDialog();
      showMessage('Company permanently deleted.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const runPendingAction = () => {
    if (pendingAction === 'create') {
      createCompany();
      return;
    }
    if (pendingAction === 'update') {
      updateCompany();
      return;
    }
    if (pendingAction === 'archive') {
      archiveCompany(pendingCompany);
      return;
    }
    if (pendingAction === 'delete') {
      deleteCompany();
    }
  };

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Manage Companies</Typography>

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={6}>
          <Paper component="form" onSubmit={createCompany} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Create Company</Typography>

            <CompanyFields form={createForm} onChange={handleCreateChange} />

            <Button type="submit" variant="contained" disabled={saving || !createForm.companyName.trim()} sx={{ mt: 2 }}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Edit Company</Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Company</InputLabel>
              <Select value={companyID} label="Company" onChange={event => setCompanyID(event.target.value)}>
                <MenuItem value="">No company selected</MenuItem>
                {companies.map(company => (
                  <MenuItem key={company.companyID} value={company.companyID}>{company.companyName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <CompanyFields form={editForm} onChange={handleEditChange} disabled={!selectedCompany} />

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                disabled={saving || !selectedCompany || !editForm.companyName.trim()}
                onClick={() => requestPassword('update')}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={saving || !canDeleteSelectedCompany}
                onClick={() => requestPassword('delete')}
              >
                Delete
              </Button>
            </Stack>

            {selectedCompany && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Attached Work Orders</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {attachedWorkOrders.length ? attachedWorkOrders.map(order => (
                    <Chip
                      key={order.workOrderID}
                      label={`#${order.workOrderID} (${order.status?.replaceAll('_', ' ')}${order.archived ? ', archived' : ''})`}
                      onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}
                      clickable
                    />
                  )) : <Chip label="No attached work orders" />}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} sx={{ mt: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Companies</Typography>

            <TableContainer sx={{ maxHeight: 360, overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map(company => (
                    <TableRow key={company.companyID}>
                    <TableCell>
                        <Button size="small" onClick={() => navigate(`/admin/companies/${company.companyID}`)}>
                          {company.companyName}
                        </Button>
                      </TableCell>
                      <TableCell>{company.companyAddress || 'Not set'}</TableCell>
                      <TableCell>{company.companyPhone || 'Not set'}</TableCell>
                      <TableCell>{formatDateTime(company.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" color="warning" disabled={saving} onClick={() => archiveCompany(company)}>
                          Archive
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!companies.length && (
                    <TableRow>
                      <TableCell colSpan={5}>No companies found.</TableCell>
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
        <DialogTitle>{pendingAction === 'delete' ? 'Delete Company' : 'Confirm Changes'}</DialogTitle>
        <DialogContent>
          {pendingAction === 'delete' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This permanently deletes a company with no attached work orders and cannot be undone.
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

export default ManageCompanies;
