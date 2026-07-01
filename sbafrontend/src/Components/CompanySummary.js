import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers } from '../model';

const CompanySummary = () => {
  const { companyID } = useParams();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/companies/all-with-archived'),
      apiFetch('/workorders/all-with-archived'),
    ])
      .then(([companyData, workOrderData]) => {
        setCompanies(companyData);
        setWorkOrders(workOrderData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const company = useMemo(
    () => companies.find(item => item.companyID === Number(companyID)),
    [companies, companyID]
  );

  const associatedWorkOrders = useMemo(
    () => workOrders.filter(order => order.company?.companyID === Number(companyID)),
    [workOrders, companyID]
  );

  if (loading) return <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </Box>
    );
  }

  if (!company) return <Alert severity="warning">Company not found.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>{company.companyName}</Typography>

      <Typography variant="h6" sx={{ mb: 1 }}>Company Summary</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableBody>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Address</TableCell><TableCell>{company.companyAddress || 'Not set'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Phone</TableCell><TableCell>{company.companyPhone || 'Not set'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Email</TableCell><TableCell>{company.companyEmail || 'Not set'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Archived</TableCell><TableCell>{company.archived ? formatDateTime(company.archivedAt) : 'No'}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ mb: 1 }}>Associated Work Orders</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Work Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned Workers</TableCell>
              <TableCell>Archived</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {associatedWorkOrders.map(order => (
              <TableRow key={order.workOrderID}>
                <TableCell>
                  <Button size="small" onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}>
                    #{order.workOrderID}
                  </Button>
                </TableCell>
                <TableCell>{order.status?.replaceAll('_', ' ') || 'Not set'}</TableCell>
                <TableCell>{getWorkOrderWorkers(order).map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned'}</TableCell>
                <TableCell>{order.archived ? formatDateTime(order.archivedAt) : 'No'}</TableCell>
              </TableRow>
            ))}
            {!associatedWorkOrders.length && (
              <TableRow>
                <TableCell colSpan={4}>No work orders are associated with this company.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CompanySummary;
