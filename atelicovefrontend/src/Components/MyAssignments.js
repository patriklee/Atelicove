import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers } from '../model';
import { useAuth } from './AuthContext';

const formatStatus = (status = '') => status.replaceAll('_', ' ');

const MyAssignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/workorders')
      .then(data => setWorkOrders(data.filter(order =>
        !order.archived && getWorkOrderWorkers(order).some(worker => worker.workerID === user?.workerID)
      )))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const openWorkOrder = (workOrderID) => {
    navigate(user?.isAdmin ? `/admin/my-assignments/${workOrderID}` : `/worker/my-assignments/${workOrderID}`);
  };

  if (loading) return <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>My Assignments</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!workOrders.length && <Alert severity="info">No work orders are assigned to you.</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Work Order ID</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>Files</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workOrders.map(order => (
              <TableRow key={order.workOrderID}>
                <TableCell>
                  <Button size="small" onClick={() => openWorkOrder(order.workOrderID)}>
                    {order.workOrderID}
                  </Button>
                </TableCell>
                <TableCell>{order.company?.companyName || 'No company'}</TableCell>
                <TableCell><Chip label={formatStatus(order.status)} size="small" /></TableCell>
                <TableCell>{formatDateTime(order.startDateTime)}</TableCell>
                <TableCell>{order.fileNo ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MyAssignments;
