import React, { useEffect, useState } from 'react';
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
  Typography,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { workOrderService } from '../../services/workOrderService';
import { formatDateTime, getWorkOrderWorkers } from '../../model';
import WorkOrderDocuments from '../documents/WorkOrderDocuments';
import TableTitleRow from '../../Components/TableTitleRow';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { BackNavigation } from '../../shared/components/navigation';
import { AppAlert, AppTableSortLabel } from '../../shared/icons';

const money = (value) => Number(value || 0).toLocaleString(undefined, {
  style: 'currency',
  currency: 'USD',
});

const DetailRow = ({ label, value }) => (
  <TableRow>
    <TableCell sx={{ fontWeight: 600, width: 220 }}>{label}</TableCell>
    <TableCell>{value || 'Not set'}</TableCell>
  </TableRow>
);

const WorkOrderDetail = ({ canManageDocuments = false }) => {
  const { workOrderID } = useParams();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemOrderBy, setItemOrderBy] = useState('itemType');
  const [itemOrder, setItemOrder] = useState('asc');

  useEffect(() => {
    workOrderService.getById(workOrderID)
      .then(setWorkOrder)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [workOrderID]);

  if (loading) {
    return <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (error) {
    return (
      <PageContainer>
        <AppAlert severity="error" sx={{ mb: 2 }}>{error}</AppAlert>
        <BackNavigation fallback="/admin/workorders" />
      </PageContainer>
    );
  }

  if (!workOrder) {
    return <AppAlert severity="warning">Work order not found.</AppAlert>;
  }

  const workers = getWorkOrderWorkers(workOrder);
  const items = Array.isArray(workOrder.items) ? workOrder.items : [];
  const sortedItems = [...items].sort((a, b) => {
    const getValue = (item) => {
      if (itemOrderBy === 'lineTotal') return Number(item.quantity) * Number(item.price);
      return item[itemOrderBy] ?? '';
    };
    const aValue = getValue(a);
    const bValue = getValue(b);

    if (aValue < bValue) return itemOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return itemOrder === 'asc' ? 1 : -1;
    return 0;
  });
  const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
  const company = workOrder.company || {};

  const handleItemSort = (column) => {
    const isAsc = itemOrderBy === column && itemOrder === 'asc';
    setItemOrder(isAsc ? 'desc' : 'asc');
    setItemOrderBy(column);
  };

  return (
    <PageContainer>
      <PageHeader
        context={<BackNavigation fallback="/admin/workorders" />}
        title={`Work Order #${workOrder.workOrderID}`}
      />
      <PageSections>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableTitleRow title="Details" colSpan={2} />
          </TableHead>
          <TableBody>
            <DetailRow label="Status" value={workOrder.status} />
            <DetailRow label="Start" value={formatDateTime(workOrder.startDateTime)} />
            <DetailRow label="Finished" value={formatDateTime(workOrder.endDateTime)} />
            <DetailRow
              label="Assigned Workers"
              value={workers.map(worker => `${worker.firstName} ${worker.lastName}`).join(', ')}
            />
            <DetailRow label="Company Name" value={company.companyName} />
            <DetailRow label="Company Address" value={company.companyAddress} />
            <DetailRow label="Company Phone" value={company.companyPhone} />
            <DetailRow label="Company Email" value={company.companyEmail} />
          </TableBody>
        </Table>
      </TableContainer>

      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Comments</Typography>
        <Paper sx={{ p: 2 }}>
          <Typography>{workOrder.comment || 'No comments have been added.'}</Typography>
        </Paper>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableTitleRow title="Items" colSpan={7} />
            <TableRow>
              <TableCell>
                <AppTableSortLabel
                  active={itemOrderBy === 'itemType'}
                  direction={itemOrderBy === 'itemType' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('itemType')}
                >
                  Item Type
                </AppTableSortLabel>
              </TableCell>
              <TableCell>
                <AppTableSortLabel
                  active={itemOrderBy === 'itemName'}
                  direction={itemOrderBy === 'itemName' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('itemName')}
                >
                  Item Name
                </AppTableSortLabel>
              </TableCell>
              <TableCell align="right">
                <AppTableSortLabel
                  active={itemOrderBy === 'quantity'}
                  direction={itemOrderBy === 'quantity' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('quantity')}
                >
                  Quantity
                </AppTableSortLabel>
              </TableCell>
              <TableCell align="right">
                <AppTableSortLabel
                  active={itemOrderBy === 'price'}
                  direction={itemOrderBy === 'price' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('price')}
                >
                  Price
                </AppTableSortLabel>
              </TableCell>
              <TableCell align="right">
                <AppTableSortLabel
                  active={itemOrderBy === 'lineTotal'}
                  direction={itemOrderBy === 'lineTotal' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('lineTotal')}
                >
                  Line Total
                </AppTableSortLabel>
              </TableCell>
              <TableCell>Added</TableCell>
              <TableCell>Last Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.map(item => (
              <TableRow key={item.workOrderItemID}>
                <TableCell>{item.itemType || 'Not set'}</TableCell>
                <TableCell>{item.itemName}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{money(item.price)}</TableCell>
                <TableCell align="right">{money(Number(item.quantity) * Number(item.price))}</TableCell>
                <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                <TableCell>{formatDateTime(item.lastModifiedAt)}</TableCell>
              </TableRow>
            ))}
            {!items.length && (
              <TableRow>
                <TableCell colSpan={7}>No items are associated with this work order.</TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{money(total)}</TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <WorkOrderDocuments
        workOrderID={workOrder.workOrderID}
        canManage={canManageDocuments && workOrder.status !== 'COMPLETE' && !workOrder.archived}
      />
      </PageSections>
    </PageContainer>
  );
};

export default WorkOrderDetail;
