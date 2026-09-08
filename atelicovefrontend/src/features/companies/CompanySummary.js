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
import { apiFetch } from '../../shared/api';
import { formatDateTime, getWorkOrderWorkers } from '../../model';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { BackNavigation, TableNavigationButton } from '../../shared/components/navigation';
import { EntityEmptyState, TableTitleRow } from '../../shared/components/tables';
import { AppAlert } from '../../shared/icons';

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
      <PageContainer>
        <AppAlert severity="error" sx={{ mb: 2 }}>{error}</AppAlert>
        <BackNavigation fallback="/admin/companies" />
      </PageContainer>
    );
  }

  if (!company) return <AppAlert severity="warning">Company not found.</AppAlert>;

  return (
    <PageContainer>
      <PageHeader context={<BackNavigation fallback="/admin/companies" />} title={company.companyName} />
      <PageSections>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableTitleRow title="Company Summary" colSpan={2} />
          </TableHead>
          <TableBody>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Address</TableCell><TableCell>{company.companyAddress || 'Not set'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Phone</TableCell><TableCell>{company.companyPhone || 'Not set'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Email</TableCell><TableCell>{company.companyEmail || 'Not set'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Archived</TableCell><TableCell>{company.archived ? formatDateTime(company.archivedAt) : 'No'}</TableCell></TableRow>
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
              <TableCell>Assigned Workers</TableCell>
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
                <TableCell>{getWorkOrderWorkers(order).map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned'}</TableCell>
                <TableCell>{order.archived ? formatDateTime(order.archivedAt) : 'No'}</TableCell>
              </TableRow>
            ))}
            {!associatedWorkOrders.length && (
              <EntityEmptyState message="No work orders are associated with this company." colSpan={4} />
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </PageSections>
    </PageContainer>
  );
};

export default CompanySummary;
