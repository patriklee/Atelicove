import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardActions, CardContent,
  Chip, CircularProgress, Grid, Typography
} from '@mui/material';
import { apiFetch } from '../../shared/api';
import { workOrderService } from '../../services/workOrderService';
import { formatDateTime, getWorkOrderWorkers } from '../../model';
import { useAuth } from '../../Components/AuthContext';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { AppAlert } from '../../shared/icons';

const WorkerAssignedWork = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    workOrderService.getActive()
      .then(data => setWorkOrders(data.filter(order =>
        getWorkOrderWorkers(order).some(worker => worker.workerID === user?.workerID)
      )))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const submit = async (workOrderID) => {
    try {
      const updated = await apiFetch(`/workorders/${workOrderID}/submit`, { method: 'PUT' });
      setWorkOrders(current => current.map(order => order.workOrderID === workOrderID ? updated : order));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <PageContainer>
      <PageHeader title="Assigned Work" subtitle="Review and submit your active work orders." />
      <PageSections>
      {error && <AppAlert severity="error">{error}</AppAlert>}
      {!workOrders.length && <AppAlert severity="info">You have no assigned work orders.</AppAlert>}
      <Grid container spacing={3}>
        {workOrders.map(order => (
          <Grid item xs={12} md={6} lg={4} key={order.workOrderID}>
            <Card>
              <CardContent>
                <Typography variant="h6">Work order #{order.workOrderID}</Typography>
                <Typography>{order.company?.companyName || 'No company assigned'}</Typography>
                <Typography variant="body2" sx={{ my: 1 }}>{order.comment || 'No notes'}</Typography>
                <Typography variant="body2">Start: {formatDateTime(order.startDateTime)}</Typography>
                <Chip label={order.status} size="small" sx={{ mt: 2 }} />
              </CardContent>
              {order.status === 'IN_PROCESS' && (
                <CardActions>
                  <Button onClick={() => submit(order.workOrderID)}>Submit for review</Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
      </PageSections>
    </PageContainer>
  );
};

export default WorkerAssignedWork;
