import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api';
import { getWorkOrderWorkers, normalizeWorker } from '../../model';
import WorkOrderAssignmentPanel from './components/WorkOrderAssignmentPanel';
import WorkOrderCreateForm from './components/WorkOrderCreateForm';
import WorkOrderReviewQueue from './components/WorkOrderReviewQueue';
import WorkOrderTable from './components/WorkOrderTable';
import { MetricSummary } from '../../shared/components/metrics';
import { AppAlert, icons } from '../../shared/icons';

const emptyCreateForm = { workerIDs: [], companyID: '', comment: '' };

const WorkOrderSummary = ({ activeWorkOrders, reviewWorkOrders }) => {
  const assignedWorkerCount = new Set(
    activeWorkOrders
      .flatMap(getWorkOrderWorkers)
      .map(worker => worker.workerID)
      .filter(workerID => workerID !== '' && workerID != null),
  ).size;
  const involvedCompanyCount = new Set(
    activeWorkOrders
      .map(order => order.company?.companyID)
      .filter(companyID => companyID != null),
  ).size;
  const metrics = [
    {
      label: 'Active Work Orders',
      value: activeWorkOrders.length,
      detail: 'Currently active',
      icon: icons.workOrders,
    },
    {
      label: 'In Review',
      value: reviewWorkOrders.length,
      detail: 'Awaiting review',
      icon: icons.warning,
    },
    {
      label: 'Assigned Workers',
      value: assignedWorkerCount,
      detail: 'Across live orders',
      icon: icons.workers,
    },
    {
      label: 'Companies Involved',
      value: involvedCompanyCount,
      detail: 'Across live orders',
      icon: icons.companies,
    },
  ];

  return <MetricSummary metrics={metrics} ariaLabel="Work order summary" />;
};

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
    <Box sx={{ p: 3, pb: 8, maxWidth: 1500, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" color="text.primary">Manage Work Orders</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>Create and maintain live work orders.</Typography>
      </Box>
      {message && <AppAlert severity={message.severity} sx={{ mb: 2 }}>{message.text}</AppAlert>}

      <Stack spacing={3}>
        <WorkOrderSummary activeWorkOrders={activeWorkOrders} reviewWorkOrders={reviewWorkOrders} />

        <WorkOrderCreateForm
          form={createForm}
          workers={workers}
          companies={companies}
          saving={saving}
          onChange={changes => setCreateForm(current => ({ ...current, ...changes }))}
          onSubmit={createWorkOrder}
        />

        <WorkOrderAssignmentPanel
          workOrders={activeWorkOrders}
          selected={selected}
          selectedID={selectedID}
          workers={workers}
          companies={companies}
          workerID={workerID}
          companyID={companyID}
          saving={saving}
          onSelectWorkOrder={setSelectedID}
          onWorkerChange={setWorkerID}
          onCompanyChange={setCompanyID}
          onAddWorker={addWorker}
          onRemoveWorker={removeWorker}
          onAssignCompany={assignCompany}
          onRemoveCompany={removeCompany}
        />

        <WorkOrderReviewQueue
          workOrders={reviewWorkOrders}
          onReject={order => runAction(`/workorders/${order.workOrderID}/reject`, { method: 'PUT' }, 'Work order returned for changes.')}
          onApprove={order => runAction(`/workorders/${order.workOrderID}/approve`, { method: 'PUT' }, 'Work order approved.')}
        />

        <WorkOrderTable
          workOrders={activeWorkOrders}
          onView={order => navigate(`/admin/workorders/${order.workOrderID}`)}
          onArchive={archiveWorkOrder}
        />
      </Stack>
    </Box>
  );
};

export default ManageWorkOrders;
