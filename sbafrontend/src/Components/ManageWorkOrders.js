import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers, normalizeWorker } from '../model';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ManageWorkOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [workerID, setWorkerID] = useState('');
  const [companyID, setCompanyID] = useState('');
  const [comment, setComment] = useState('');
  const [modifyWorkOrderID, setModifyWorkOrderID] = useState('');
  const [removeWorkerID, setRemoveWorkerID] = useState('');
  const [removeCompanyID, setRemoveCompanyID] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [pendingDeleteWorkOrder, setPendingDeleteWorkOrder] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([apiFetch('/workers'), apiFetch('/companies/all'), apiFetch('/workorders')])
      .then(([workerData, companyData, workOrderData]) => {
        setWorkers(workerData.map(normalizeWorker));
        setCompanies(companyData);
        setWorkOrders(workOrderData);
      })
      .catch(error => setMessage({ severity: 'error', text: error.message }))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const activeWorkOrders = workOrders.filter(order => !order.archived);
  const modifiableWorkOrders = activeWorkOrders.filter(order => !['COMPLETE', 'IN_REVIEW'].includes(order.status));
  const reviewWorkOrders = activeWorkOrders.filter(order => order.status === 'IN_REVIEW');
  const selectedModifyWorkOrder = useMemo(
    () => workOrders.find(order => order.workOrderID === Number(modifyWorkOrderID)),
    [modifyWorkOrderID, workOrders]
  );
  const canEditSelectedWorkOrder = Boolean(selectedModifyWorkOrder);
  const selectedModifyWorkers = selectedModifyWorkOrder ? getWorkOrderWorkers(selectedModifyWorkOrder) : [];
  const selectedModifyWorker = workers.find(worker => worker.workerID === Number(removeWorkerID));
  const selectedModifyCompany = companies.find(company => company.companyID === Number(removeCompanyID));
  const modifyCompanyOptions = selectedModifyWorkOrder?.company
    ? [selectedModifyWorkOrder.company]
    : companies;
  const isSelectedWorkerAssigned = Boolean(
    selectedModifyWorker && selectedModifyWorkers.some(worker => worker.workerID === selectedModifyWorker.workerID)
  );
  const isSelectedCompanyAssigned = Boolean(
    selectedModifyCompany && selectedModifyWorkOrder?.company?.companyID === selectedModifyCompany.companyID
  );
  const canRemoveSelection = isSelectedWorkerAssigned || isSelectedCompanyAssigned;
  const canUpdateSelection = Boolean(
    canEditSelectedWorkOrder && (
      (selectedModifyWorker && !isSelectedWorkerAssigned) ||
      (selectedModifyCompany && !isSelectedCompanyAssigned)
    )
  );
  const canDeleteWorkOrder = (order) => Boolean(
    order &&
    order.status === 'OPEN' &&
    !order.endDateTime &&
    !(order.items?.length)
  );

  const resetAssignForm = () => {
    setWorkerID('');
    setCompanyID('');
    setComment('');
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    const worker = workers.find(item => item.workerID === Number(workerID));
    const company = companies.find(item => item.companyID === Number(companyID));

    setSaving(true);
    setMessage(null);
    try {
      const workerPayload = worker ? {
        workerID: worker.workerID,
        workerFName: worker.firstName,
        workerLName: worker.lastName,
        workerUser: worker.username,
        admin: worker.isAdmin,
      } : null;

      const saved = await apiFetch('/workorders', {
        method: 'POST',
        body: JSON.stringify({
          workers: workerPayload ? [workerPayload] : [],
          company: company || null,
          comment: comment.trim(),
        }),
      });

      setMessage({ severity: 'success', text: `Work order #${saved.workOrderID} created.` });
      resetAssignForm();
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const archiveWorkOrder = async (workOrder) => {
    if (!workOrder) return;
    if (workOrder.status !== 'COMPLETE') return;
    if (!window.confirm(`Archive completed work order #${workOrder.workOrderID}?`)) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/workorders/${workOrder.workOrderID}`, { method: 'DELETE' });
      setMessage({ severity: 'success', text: `Work order #${workOrder.workOrderID} archived.` });
      if (Number(modifyWorkOrderID) === workOrder.workOrderID) {
        setModifyWorkOrderID('');
        setRemoveWorkerID('');
        setRemoveCompanyID('');
      }
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteWorkOrder = (workOrder) => {
    if (!canDeleteWorkOrder(workOrder)) return;

    setPendingDeleteWorkOrder(workOrder);
    setDeletePassword('');
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletePassword('');
    setPendingDeleteWorkOrder(null);
  };

  const deleteWorkOrder = async () => {
    if (!pendingDeleteWorkOrder) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: user.username, password: deletePassword }),
      });
      await apiFetch(`/workorders/${pendingDeleteWorkOrder.workOrderID}/permanent`, { method: 'DELETE' });
      setMessage({ severity: 'success', text: `Work order #${pendingDeleteWorkOrder.workOrderID} deleted.` });

      if (Number(modifyWorkOrderID) === pendingDeleteWorkOrder.workOrderID) {
        setModifyWorkOrderID('');
        setRemoveWorkerID('');
        setRemoveCompanyID('');
      }

      closeDeleteDialog();
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeSelections = async () => {
    if (!selectedModifyWorkOrder || !canRemoveSelection) return;

    setSaving(true);
    setMessage(null);
    try {
      let updated = selectedModifyWorkOrder;

      if (isSelectedWorkerAssigned) {
        updated = await apiFetch(`/workorders/${selectedModifyWorkOrder.workOrderID}/workers/${removeWorkerID}`, {
          method: 'DELETE',
        });
      }

      if (isSelectedCompanyAssigned) {
        updated = await apiFetch(`/workorders/${selectedModifyWorkOrder.workOrderID}/company`, {
          method: 'DELETE',
        });
      }

      setMessage({
        severity: 'success',
        text: `Selected item${removeWorkerID && removeCompanyID ? 's' : ''} removed from work order #${updated.workOrderID}.`,
      });
      setRemoveWorkerID('');
      setRemoveCompanyID('');
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateSelections = async () => {
    if (!selectedModifyWorkOrder || !canUpdateSelection) return;

    setSaving(true);
    setMessage(null);
    try {
      let updated = selectedModifyWorkOrder;

      if (selectedModifyWorker && !isSelectedWorkerAssigned) {
        updated = await apiFetch(`/workorders/${selectedModifyWorkOrder.workOrderID}/assign`, {
          method: 'PUT',
          body: JSON.stringify({ workerID: selectedModifyWorker.workerID }),
        });
      }

      if (selectedModifyCompany && !isSelectedCompanyAssigned) {
        updated = await apiFetch(`/workorders/${selectedModifyWorkOrder.workOrderID}/company`, {
          method: 'PUT',
          body: JSON.stringify({ companyID: selectedModifyCompany.companyID }),
        });
      }

      setMessage({
        severity: 'success',
        text: `Work order #${updated.workOrderID} updated.`,
      });
      setRemoveWorkerID('');
      setRemoveCompanyID('');
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const reviewWorkOrder = async (workOrderID, action) => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiFetch(`/workorders/${workOrderID}/${action}`, { method: 'PUT' });
      setMessage({
        severity: 'success',
        text: `Work order #${updated.workOrderID} ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Manage Work Orders</Typography>
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={6}>
          <Paper component="form" onSubmit={handleAssign} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Create Work Order</Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Worker or Admin</InputLabel>
              <Select value={workerID} label="Worker or Admin" onChange={event => setWorkerID(event.target.value)}>
                <MenuItem value="">No worker selected</MenuItem>
                {workers.map(worker => (
                  <MenuItem key={worker.workerID} value={worker.workerID}>
                    {worker.firstName} {worker.lastName}{worker.isAdmin ? ' (Admin)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Company</InputLabel>
              <Select value={companyID} label="Company" onChange={event => setCompanyID(event.target.value)}>
                <MenuItem value="">No company selected</MenuItem>
                {companies.map(company => (
                  <MenuItem key={company.companyID} value={company.companyID}>{company.companyName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Comments"
              value={comment}
              onChange={event => setComment(event.target.value)}
              fullWidth
              multiline
              minRows={4}
              margin="normal"
            />

            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Edit Work Order</Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Work Order</InputLabel>
              <Select
                value={modifyWorkOrderID}
                label="Work Order"
                onChange={event => {
                  setModifyWorkOrderID(event.target.value);
                  setRemoveWorkerID('');
                  setRemoveCompanyID('');
                }}
              >
                <MenuItem value="">No Work Order</MenuItem>
                {modifiableWorkOrders.map(order => (
                  <MenuItem key={order.workOrderID} value={order.workOrderID}>
                    #{order.workOrderID} - {order.company?.companyName || 'No company'} ({order.status})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" disabled={!canEditSelectedWorkOrder}>
              <InputLabel>Worker</InputLabel>
              <Select
                value={removeWorkerID}
                label="Worker"
                onChange={event => setRemoveWorkerID(event.target.value)}
              >
                <MenuItem value="">No Worker</MenuItem>
                {workers.map(worker => (
                  <MenuItem key={worker.workerID} value={worker.workerID}>
                    {worker.firstName} {worker.lastName}{worker.isAdmin ? ' (Admin)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" disabled={!canEditSelectedWorkOrder}>
              <InputLabel>Company</InputLabel>
              <Select
                value={removeCompanyID}
                label="Company"
                onChange={event => setRemoveCompanyID(event.target.value)}
              >
                <MenuItem value="">No Company</MenuItem>
                {modifyCompanyOptions.map(company => (
                  <MenuItem key={company.companyID} value={company.companyID}>
                    {company.companyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="warning"
                disabled={saving || !canEditSelectedWorkOrder || !canRemoveSelection}
                onClick={removeSelections}
              >
                Remove
              </Button>
              <Button
                variant="contained"
                disabled={saving || !canUpdateSelection}
                onClick={updateSelections}
              >
                Update
              </Button>
              <Button
                variant="outlined"
                disabled={!selectedModifyWorkOrder}
                onClick={() => navigate(`/admin/workorders/${selectedModifyWorkOrder.workOrderID}`)}
              >
                View Details
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={saving || !canDeleteWorkOrder(selectedModifyWorkOrder)}
                onClick={() => requestDeleteWorkOrder(selectedModifyWorkOrder)}
              >
                Delete
              </Button>
            </Stack>

            {selectedModifyWorkOrder && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Assigned Workers</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {selectedModifyWorkers.length ? selectedModifyWorkers.map(worker => (
                    <Chip
                      key={worker.workerID}
                      label={`${worker.firstName} ${worker.lastName}${worker.isAdmin ? ' (Admin)' : ''}`}
                      onClick={() => navigate(`/admin/manage-workers/${worker.workerID}`)}
                      clickable
                    />
                  )) : <Chip label="No assigned workers" />}
                </Stack>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Company</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {selectedModifyWorkOrder.company ? (
                    <Chip
                      label={selectedModifyWorkOrder.company.companyName}
                      onClick={() => navigate(`/admin/manage-companies/${selectedModifyWorkOrder.company.companyID}`)}
                      clickable
                    />
                  ) : <Chip label="No company assigned" />}
                </Stack>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 3 }}>
              If every worker is removed from a work order, its status returns to OPEN until someone is assigned again.
            </Alert>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} sx={{ mt: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Review Work Order</Typography>

            <TableContainer sx={{ height: 320, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Work Order</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Assigned Workers</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviewWorkOrders.map(order => (
                    <TableRow key={order.workOrderID}>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}
                        >
                          {order.workOrderID}
                        </Button>
                      </TableCell>
                      <TableCell>{order.company?.companyName || 'No company'}</TableCell>
                      <TableCell>
                        {getWorkOrderWorkers(order).map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned'}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            disabled={saving}
                            onClick={() => reviewWorkOrder(order.workOrderID, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="warning"
                            disabled={saving}
                            onClick={() => reviewWorkOrder(order.workOrderID, 'reject')}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!reviewWorkOrders.length && (
                    <TableRow>
                      <TableCell colSpan={4}>No work orders are currently in review.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} sx={{ mt: 6 }}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Work Orders</Typography>

            <TableContainer sx={{ height: 320, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Work Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeWorkOrders.map(order => (
                    <TableRow key={order.workOrderID}>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}
                        >
                          {order.workOrderID}
                        </Button>
                      </TableCell>
                      <TableCell>{order.status.replaceAll('_', ' ')}</TableCell>
                      <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(order.lastModifiedAt)}</TableCell>
                      <TableCell align="right">
                        {order.status === 'COMPLETE' && (
                          <Button
                            size="small"
                            color="warning"
                            disabled={saving}
                            onClick={() => archiveWorkOrder(order)}
                          >
                            Archive
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!activeWorkOrders.length && (
                    <TableRow>
                      <TableCell colSpan={5}>No work orders found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} fullWidth maxWidth="xs">
        <DialogTitle>Delete Work Order</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This permanently deletes an empty open work order and cannot be undone.
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Enter your password to delete work order #{pendingDeleteWorkOrder?.workOrderID}.
          </Typography>
          <TextField
            label="Enter your password"
            type="password"
            value={deletePassword}
            onChange={event => setDeletePassword(event.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button color="error" variant="contained" disabled={!deletePassword || saving} onClick={deleteWorkOrder}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageWorkOrders;
