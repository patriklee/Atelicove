import React from 'react';
import { Alert, Box, Paper, Typography } from '@mui/material';

const InspectorBillingPage = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Billing</Typography>
    <Paper sx={{ p: 3, maxWidth: 720 }}>
      <Alert severity="warning">
        Billing entry is temporarily unavailable. The current backend has a work-order item service,
        but no controller endpoint for creating billing items, so submitting the old form would lose data.
      </Alert>
    </Paper>
  </Box>
);

export default InspectorBillingPage;
