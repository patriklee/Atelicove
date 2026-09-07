import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../api';
import { formatDateTime, getWorkOrderWorkers, normalizeWorker } from '../../model';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { BackNavigation, TableNavigationButton } from '../../shared/components/navigation';
import { EntityEmptyState, TableTitleRow } from '../../shared/components/tables';
import { AppAlert } from '../../shared/icons';

const WorkerSummary = () => {
  const { workerID } = useParams();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/workers/all-with-archived'),
      apiFetch('/workorders/all-with-archived'),
    ])
      .then(([workerData, workOrderData]) => {
        setWorkers(workerData.map(normalizeWorker));
        setWorkOrders(workOrderData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const worker = useMemo(
    () => workers.find(item => item.workerID === Number(workerID)),
    [workers, workerID]
  );

  const associatedWorkOrders = useMemo(
    () => workOrders.filter(order =>
      getWorkOrderWorkers(order).some(item => item.workerID === Number(workerID))
    ),
    [workOrders, workerID]
  );

  if (loading) return <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>;

  if (error) {
    return (
      <PageContainer>
        <AppAlert severity="error" sx={{ mb: 2 }}>{error}</AppAlert>
        <BackNavigation fallback="/admin/workers" />
      </PageContainer>
    );
  }

  if (!worker) return <AppAlert severity="warning">Worker not found.</AppAlert>;

  return (
    <PageContainer>
      <PageHeader
        context={<BackNavigation fallback="/admin/workers" />}
        title={`${worker.firstName} ${worker.lastName}`}
      />
      <PageSections>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableTitleRow title="Worker Summary" colSpan={2} />
          </TableHead>
          <TableBody>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Worker ID</TableCell><TableCell>{worker.workerID}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Username</TableCell><TableCell>{worker.username}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Email</TableCell><TableCell>{worker.email || 'Not set'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Role</TableCell><TableCell>{worker.isAdmin ? 'Admin' : 'Worker'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Worker Role</TableCell><TableCell>{worker.roleTitle || 'Not set'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Role Description</TableCell><TableCell>{worker.roleDescription || 'Not set'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Archived</TableCell><TableCell>{worker.archived ? formatDateTime(worker.archivedAt) : 'No'}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableTitleRow title="Associated Work Orders" colSpan={4} />
            <TableRow>
              <TableCell>Work Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Archived</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {associatedWorkOrders.map(order => (
              <TableRow key={order.workOrderID} hover>
                <TableCell>
                  <TableNavigationButton onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}>
                    #{order.workOrderID}
                  </TableNavigationButton>
                </TableCell>
                <TableCell>{order.status?.replaceAll('_', ' ') || 'Not set'}</TableCell>
                <TableCell>{order.company?.companyName || 'No company'}</TableCell>
                <TableCell>{order.archived ? formatDateTime(order.archivedAt) : 'No'}</TableCell>
              </TableRow>
            ))}
            {!associatedWorkOrders.length && (
              <EntityEmptyState message="No work orders are associated with this worker." colSpan={4} />
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </PageSections>
    </PageContainer>
  );
};

export default WorkerSummary;
