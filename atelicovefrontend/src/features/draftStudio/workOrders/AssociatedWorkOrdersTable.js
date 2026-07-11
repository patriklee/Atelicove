import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { formatCurrency } from '../../../shared/utils/formatters';

const workOrderTotal = (workOrder = {}) =>
  (workOrder.items || []).reduce((total, item) => {
    const price = Number(item.price || item.itemPrice || 0);
    const quantity = Number(item.quantity || 1);
    return total + price * quantity;
  }, 0);

const statusColor = (status) => {
  switch (status) {
    case 'COMPLETE':
      return 'success';
    case 'ACTIVE':
      return 'info';
    case 'DRAFT':
      return 'warning';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
};

const AssociatedWorkOrdersTable = ({
  project,
  workOrders = [],
  saving = false,
  onEditWorkOrder,
  onRemoveWorkOrder,
  getTeamName,
}) => {
  if (!workOrders.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        No work orders are associated with this project yet.
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>ID</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Team</TableCell>
          <TableCell>Comment</TableCell>
          <TableCell align="right">Estimated Total</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {workOrders.map((workOrder) => (
          <TableRow key={`${workOrder.status || 'WO'}-${workOrder.workOrderID}`} hover>
            <TableCell>
              <Typography variant="body2">#{workOrder.workOrderID}</Typography>
              {workOrder.status === 'DRAFT' && workOrder.workOrderName && (
                <Typography variant="caption" color="text.secondary">{workOrder.workOrderName}</Typography>
              )}
            </TableCell>
            <TableCell>
              <Chip size="small" color={statusColor(workOrder.status)} label={workOrder.status || 'OPEN'} />
            </TableCell>
            <TableCell>
              {getTeamName ? getTeamName(project, workOrder) : workOrder.plannedTeamName || workOrder.team?.teamName || 'Unassigned'}
            </TableCell>
            <TableCell>{workOrder.comment || workOrder.description || '—'}</TableCell>
            <TableCell align="right">{formatCurrency(workOrderTotal(workOrder))}</TableCell>
            <TableCell align="right">
              <Button size="small" variant="outlined" onClick={() => onEditWorkOrder?.(project, workOrder)}>
                Edit
              </Button>{' '}
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={saving}
                onClick={() => onRemoveWorkOrder?.(project, workOrder)}
              >
                {workOrder.status === 'DRAFT' ? 'Archive' : 'Remove'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AssociatedWorkOrdersTable;
