import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
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
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { formatDateTime, formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers, normalizeWorker } from '../../model';
import { EntityEmptyState } from '../../shared/components/tables';

const emptyCreateForm = { workerIDs: [], companyID: '', comment: '' };

const ManageWorkOrders = () => {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [selectedID, setSelectedID] = useState('');
  const [workerID, setWorkerID] = useState('');
  const [companyID, setCompanyID] = useState('');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [workerData, companyData, workOrderData] = await Promise.all([
        apiFetch('/workers'),
        apiFetch('/companies/all'),
        apiFetch('/workorders/all-with-archived'),
      ]);
      setWorkers(workerData.filter(worker => !worker.archived).map(normalizeWorker));
      setCompanies(companyData.filter(company => !company.archived));
      setWorkOrders(workOrderData);
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selected = workOrders.find(order => order.workOrderID === Number(selectedID));
  const assignedWorkerIDs = new Set(getWorkOrderWorkers(selected || {}).map(worker => worker.workerID));
  const activeWorkOrders = useMemo(() => workOrders.filter(order => !order.archived), [workOrders]);
  const reviewWorkOrders = activeWorkOrders.filter(order => order.status === 'IN_REVIEW');

  const runAction = async (path, options, successText) => {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(path, options);
      await loadData();
      setMessage({ severity: 'success', text: successText });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const createWorkOrder = async (event) => {
    event.preventDefault();
    await runAction('/workorders', {
      method: 'POST',
      body: JSON.stringify({
        workerIDs: createForm.workerIDs.map(Number),
        companyID: createForm.companyID ? Number(createForm.companyID) : null,
        comment: createForm.comment || null,
      }),
    }, 'Work order created.');
    setCreateForm(emptyCreateForm);
  };

  const addWorker = async () => {
    if (!selected || !workerID) return;
    await runAction(`/workorders/${selected.workOrderID}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ workerID: Number(workerID) }),
    }, 'Worker assigned.');
    setWorkerID('');
  };

  const removeWorker = async (id) => {
    if (!selected) return;
    await runAction(`/workorders/${selected.workOrderID}/workers/${id}`, { method: 'DELETE' }, 'Worker removed.');
  };

  const assignCompany = async () => {
    if (!selected || !companyID) return;
    await runAction(`/workorders/${selected.workOrderID}/company`, {
      method: 'PUT',
      body: JSON.stringify({ companyID: Number(companyID) }),
    }, 'Company assigned.');
    setCompanyID('');
  };

  const removeCompany = () => selected && runAction(
    `/workorders/${selected.workOrderID}/company`,
    { method: 'DELETE' },
    'Company removed.',
  );

  const archiveWorkOrder = (order) => {
    if (!window.confirm(`Archive work order #${order.workOrderID}?`)) return;
    runAction(`/workorders/${order.workOrderID}`, { method: 'DELETE' }, 'Work order archived.');
  };

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Manage Work Orders</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Create and maintain live work orders.</Typography>
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Paper component="form" onSubmit={createWorkOrder} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Create Work Order</Typography>
        <Stack spacing={2}>
          <FormControl>
            <InputLabel>Workers</InputLabel>
            <Select multiple value={createForm.workerIDs} label="Workers" onChange={event => setCreateForm(current => ({ ...current, workerIDs: event.target.value }))}>
              {workers.map(worker => <MenuItem key={worker.workerID} value={worker.workerID}>{worker.firstName} {worker.lastName}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Company</InputLabel>
            <Select value={createForm.companyID} label="Company" onChange={event => setCreateForm(current => ({ ...current, companyID: event.target.value }))}>
              <MenuItem value="">No company</MenuItem>
              {companies.map(company => <MenuItem key={company.companyID} value={company.companyID}>{company.companyName}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Work order note" value={createForm.comment} onChange={event => setCreateForm(current => ({ ...current, comment: event.target.value }))} multiline minRows={2} />
          <Button type="submit" variant="contained" disabled={saving}>Create</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Modify Assignments</Typography>
        <Stack spacing={2}>
          <FormControl>
            <InputLabel>Work Order</InputLabel>
            <Select value={selectedID} label="Work Order" onChange={event => setSelectedID(event.target.value)}>
              <MenuItem value="">Select a work order</MenuItem>
              {activeWorkOrders.filter(order => !['COMPLETE', 'IN_REVIEW'].includes(order.status)).map(order => <MenuItem key={order.workOrderID} value={order.workOrderID}>#{order.workOrderID} · {(order.status || 'OPEN').replaceAll('_', ' ')}</MenuItem>)}
            </Select>
          </FormControl>
          {selected && <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <FormControl fullWidth><InputLabel>Add Worker</InputLabel><Select value={workerID} label="Add Worker" onChange={event => setWorkerID(event.target.value)}><MenuItem value="">Select worker</MenuItem>{workers.filter(worker => !assignedWorkerIDs.has(worker.workerID)).map(worker => <MenuItem key={worker.workerID} value={worker.workerID}>{worker.firstName} {worker.lastName}</MenuItem>)}</Select></FormControl>
              <Button variant="outlined" onClick={addWorker} disabled={!workerID || saving}>Assign</Button>
            </Stack>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{getWorkOrderWorkers(selected).map(worker => <Chip key={worker.workerID} label={`${worker.firstName} ${worker.lastName}`} onDelete={() => removeWorker(worker.workerID)} />)}{!getWorkOrderWorkers(selected).length && <Chip label="No assigned workers" />}</Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <FormControl fullWidth><InputLabel>Company</InputLabel><Select value={companyID} label="Company" onChange={event => setCompanyID(event.target.value)}><MenuItem value="">Select company</MenuItem>{companies.map(company => <MenuItem key={company.companyID} value={company.companyID}>{company.companyName}</MenuItem>)}</Select></FormControl>
              <Button variant="outlined" onClick={assignCompany} disabled={!companyID || saving}>Assign</Button>
              <Button color="warning" onClick={removeCompany} disabled={!selected.company || saving}>Remove Current</Button>
            </Stack>
          </>}
        </Stack>
      </Paper>

      {reviewWorkOrders.length > 0 && <Paper sx={{ p: 3, mb: 4 }}><Typography variant="h5" sx={{ mb: 2 }}>Review Queue</Typography>{reviewWorkOrders.map(order => <Stack key={order.workOrderID} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}><Typography>Work Order #{order.workOrderID}</Typography><Stack direction="row" spacing={1}><Button onClick={() => runAction(`/workorders/${order.workOrderID}/reject`, { method: 'PUT' }, 'Work order returned for changes.')}>Reject</Button><Button variant="contained" onClick={() => runAction(`/workorders/${order.workOrderID}/approve`, { method: 'PUT' }, 'Work order approved.')}>Approve</Button></Stack></Stack>)}</Paper>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow><TableCell>Work Order</TableCell><TableCell>Status</TableCell><TableCell>Workers</TableCell><TableCell>Company</TableCell><TableCell>Start</TableCell><TableCell>Price</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {activeWorkOrders.map(order => <TableRow key={order.workOrderID}><TableCell><Button onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}>#{order.workOrderID}</Button></TableCell><TableCell><Chip size="small" label={(order.status || 'OPEN').replaceAll('_', ' ')} /></TableCell><TableCell>{getWorkOrderWorkers(order).map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned'}</TableCell><TableCell>{order.company?.companyName || 'No company'}</TableCell><TableCell>{formatDateTime(order.startDateTime)}</TableCell><TableCell>{formatMoney(getWorkOrderActualPrice(order))}</TableCell><TableCell align="right">{order.status === 'COMPLETE' && <Button color="warning" onClick={() => archiveWorkOrder(order)}>Archive</Button>}</TableCell></TableRow>)}
            {!activeWorkOrders.length && <EntityEmptyState message="No active work orders found." colSpan={7} />}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManageWorkOrders;
