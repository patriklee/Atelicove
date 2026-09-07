import React from 'react';
import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { formatDateTime, formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers } from '../../../model';
import TableNavigationButton from '../../../shared/components/navigation/TableNavigationButton';
import { EntityEmptyState } from '../../../shared/components/tables';

const WorkOrderTable = ({ workOrders, onView, onArchive }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Work Order</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Workers</TableCell>
          <TableCell>Company</TableCell>
          <TableCell>Start</TableCell>
          <TableCell>Price</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {workOrders.map(order => (
          <TableRow key={order.workOrderID} hover>
            <TableCell><TableNavigationButton onClick={() => onView(order)}>#{order.workOrderID}</TableNavigationButton></TableCell>
            <TableCell><Chip size="small" label={(order.status || 'OPEN').replaceAll('_', ' ')} /></TableCell>
            <TableCell>{getWorkOrderWorkers(order).map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned'}</TableCell>
            <TableCell>{order.company?.companyName || 'No company'}</TableCell>
            <TableCell>{formatDateTime(order.startDateTime)}</TableCell>
            <TableCell>{formatMoney(getWorkOrderActualPrice(order))}</TableCell>
            <TableCell align="right">
              {order.status === 'COMPLETE' && <Button color="warning" onClick={() => onArchive(order)}>Archive</Button>}
            </TableCell>
          </TableRow>
        ))}
        {!workOrders.length && <EntityEmptyState message="No active work orders found." colSpan={7} />}
      </TableBody>
    </Table>
  </TableContainer>
);

export default WorkOrderTable;
