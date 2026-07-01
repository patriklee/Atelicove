import React, { useEffect, useState } from 'react';
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
  TableSortLabel,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers } from '../model';

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

const WorkOrderDetail = () => {
  const { workOrderID } = useParams();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemOrderBy, setItemOrderBy] = useState('itemType');
  const [itemOrder, setItemOrder] = useState('asc');

  useEffect(() => {
    apiFetch(`/workorders/${workOrderID}`)
      .then(setWorkOrder)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [workOrderID]);

  if (loading) {
    return <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </Box>
    );
  }

  if (!workOrder) {
    return <Alert severity="warning">Work order not found.</Alert>;
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
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Work Order #{workOrder.workOrderID}
      </Typography>

      <Typography variant="h6" sx={{ mb: 1 }}>Details</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
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

      <Typography variant="h6" sx={{ mb: 1 }}>Comments</Typography>
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography>{workOrder.comment || 'No comments have been added.'}</Typography>
      </Paper>

      <Typography variant="h6" sx={{ mb: 1 }}>Items</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={itemOrderBy === 'itemType'}
                  direction={itemOrderBy === 'itemType' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('itemType')}
                >
                  Item Type
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={itemOrderBy === 'itemName'}
                  direction={itemOrderBy === 'itemName' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('itemName')}
                >
                  Item Name
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={itemOrderBy === 'quantity'}
                  direction={itemOrderBy === 'quantity' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('quantity')}
                >
                  Quantity
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={itemOrderBy === 'price'}
                  direction={itemOrderBy === 'price' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('price')}
                >
                  Price
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={itemOrderBy === 'lineTotal'}
                  direction={itemOrderBy === 'lineTotal' ? itemOrder : 'asc'}
                  onClick={() => handleItemSort('lineTotal')}
                >
                  Line Total
                </TableSortLabel>
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
    </Box>
  );
};

export default WorkOrderDetail;
