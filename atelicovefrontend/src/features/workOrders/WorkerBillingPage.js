import React from 'react';
import { Paper } from '@mui/material';
import { PageContainer, PageHeader } from '../../shared/components/layout';
import { AppAlert } from '../../shared/icons';

const WorkerBillingPage = () => (
  <PageContainer>
    <PageHeader title="Billing" subtitle="Review billing availability for assigned work." />
    <Paper sx={{ p: 3, maxWidth: 720 }}>
      <AppAlert severity="warning">
        Billing entry is temporarily unavailable. The current backend has a work-order item service,
        but no controller endpoint for creating billing items, so submitting the old form would lose data.
      </AppAlert>
    </Paper>
  </PageContainer>
);

export default WorkerBillingPage;
