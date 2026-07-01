import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardActions, CardContent,
  Chip, CircularProgress, Grid, Typography
} from '@mui/material';
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers } from '../model';
import { useAuth } from './AuthContext';

const InspectorAssignedWork = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/workorders')
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Assigned Work</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!workOrders.length && <Alert severity="info">You have no assigned work orders.</Alert>}
      <Grid container spacing={2}>
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
    </Box>
  );
};

export default InspectorAssignedWork;
