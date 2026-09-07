import React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { PageSurface } from '../../../shared/components/layout';

const WorkOrderReviewQueue = ({ workOrders, onReject, onApprove }) => {
  if (!workOrders.length) return null;

  return (
    <PageSurface>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Review Queue</Typography>
      {workOrders.map(order => (
        <Stack key={order.workOrderID} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
          <Typography>Work Order #{order.workOrderID}</Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => onReject(order)}>Reject</Button>
            <Button variant="contained" onClick={() => onApprove(order)}>Approve</Button>
          </Stack>
        </Stack>
      ))}
    </PageSurface>
  );
};

export default WorkOrderReviewQueue;
