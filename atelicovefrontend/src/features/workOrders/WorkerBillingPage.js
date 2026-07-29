import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { AppAlert } from '../../shared/icons';

const WorkerBillingPage = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Billing</Typography>
    <Paper sx={{ p: 3, maxWidth: 720 }}>
      <AppAlert severity="warning">
        Billing entry is temporarily unavailable. The current backend has a work-order item service,
        but no controller endpoint for creating billing items, so submitting the old form would lose data.
      </AppAlert>
    </Paper>
  </Box>
);

export default WorkerBillingPage;
