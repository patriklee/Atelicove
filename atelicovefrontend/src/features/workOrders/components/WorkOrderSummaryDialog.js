import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers } from '../../../model';
import { EntityEmptyState } from '../../../shared/components/tables';

const formatStatus = (status = '') => status.replaceAll('_', ' ');

const WorkOrderSummaryDialog = ({ workOrder, mode = 'items', onClose }) => (
  <Dialog open={Boolean(workOrder)} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>
      {mode === 'summary'
        ? `Work Order #${workOrder?.workOrderID}`
        : `Work Order #${workOrder?.workOrderID} Items`}
    </DialogTitle>
    <DialogContent dividers>
      {mode === 'summary' && (
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 160 }}>Status</TableCell>
                <TableCell>{formatStatus(workOrder?.status)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                <TableCell>{workOrder?.projectName || 'No project'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                <TableCell>{workOrder?.company?.companyName || 'No company'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Workers</TableCell>
                <TableCell>{getWorkOrderWorkers(workOrder || {}).map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                <TableCell>{formatMoney(getWorkOrderActualPrice(workOrder || {}))}</TableCell>
              </TableRow>
              {workOrder?.comment && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Note</TableCell>
                  <TableCell>{workOrder.comment}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(workOrder?.items || []).map(item => (
              <TableRow key={item.workOrderItemID || item.itemName}>
                <TableCell>{item.itemName || 'Item'}</TableCell>
                <TableCell align="right">{item.quantity ?? 0}</TableCell>
                <TableCell align="right">{formatMoney(item.price)}</TableCell>
              </TableRow>
            ))}
            {!(workOrder?.items || []).length && (
              <EntityEmptyState message="No items are associated with this work order." colSpan={3} />
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default WorkOrderSummaryDialog;
