import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { PageSurface } from '../../../shared/components/layout';
import { AppSelect } from '../../../shared/icons';

const WorkerFields = ({ form, onChange, mode }) => (
  <Stack spacing={2}>
    <TextField label="First Name" name="firstName" value={form.firstName} onChange={onChange} fullWidth />
    <TextField label="Last Name" name="lastName" value={form.lastName} onChange={onChange} fullWidth />
    <TextField label="Display Name" name="displayName" value={form.displayName} onChange={onChange} fullWidth />
    <TextField label="Username" name="username" value={form.username} onChange={onChange} fullWidth disabled={mode === 'edit'} />
    <TextField label="Email" name="email" type="email" value={form.email} onChange={onChange} fullWidth />
    <TextField label="Worker Role" name="roleTitle" value={form.roleTitle} onChange={onChange} fullWidth />
    <TextField label="Role Description" name="roleDescription" value={form.roleDescription} onChange={onChange} fullWidth multiline minRows={2} />
    {mode === 'create' && (
      <FormControlLabel
        control={<Checkbox name="isAdmin" checked={form.isAdmin} onChange={onChange} />}
        label="Admin"
      />
    )}
  </Stack>
);

export const WorkerCreatePanel = ({ form, saving, onChange, onSubmit }) => (
  <Grid item xs={12} md={6}>
    <PageSurface component="form" onSubmit={onSubmit} sx={{ height: '100%' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Create Worker</Typography>
      <WorkerFields form={form} onChange={onChange} mode="create" />
      <Stack spacing={2} sx={{ mt: 2 }}>
        <TextField label="Password" name="password" type="password" value={form.password} onChange={onChange} fullWidth />
        <TextField label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} fullWidth />
      </Stack>
      <Button
        type="submit"
        variant="contained"
        disabled={
          saving
          || !form.firstName.trim()
          || !form.lastName.trim()
          || !form.username.trim()
          || !form.email.trim()
          || form.password.length < 8
          || !form.confirmPassword
        }
        sx={{ mt: 2 }}
      >
        {saving ? 'Creating...' : 'Create'}
      </Button>
    </PageSurface>
  </Grid>
);

export const WorkerEditPanel = ({
  workers,
  workerID,
  form,
  selectedWorker,
  attachedWorkOrders,
  canDelete,
  saving,
  onWorkerChange,
  onChange,
  onUpdate,
  onDelete,
  onOpenWorkOrder,
}) => (
  <Grid item xs={12} md={6}>
    <PageSurface sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Edit Worker</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Worker</InputLabel>
        <AppSelect
          value={selectedWorker && !selectedWorker.isAdmin ? workerID : ''}
          label="Worker"
          onChange={event => onWorkerChange(event.target.value)}
        >
          <MenuItem value="">No worker selected</MenuItem>
          {workers.filter(worker => !worker.isAdmin).map(worker => (
            <MenuItem key={worker.workerID} value={worker.workerID}>
              {worker.firstName} {worker.lastName}{worker.isAdmin ? ' (Admin)' : ''}
            </MenuItem>
          ))}
        </AppSelect>
      </FormControl>
      <WorkerFields form={form} onChange={onChange} mode="edit" />
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          disabled={saving || !selectedWorker || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()}
          onClick={onUpdate}
        >
          Save Changes
        </Button>
        <Button
          variant="outlined"
          color="error"
          disabled={saving || !canDelete}
          onClick={onDelete}
        >
          Delete
        </Button>
      </Stack>
      {selectedWorker && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Associated Work Orders</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {attachedWorkOrders.length ? attachedWorkOrders.map(order => (
              <Chip
                key={order.workOrderID}
                label={`#${order.workOrderID} (${order.status?.replaceAll('_', ' ')})`}
                onClick={() => onOpenWorkOrder(order)}
                clickable
              />
            )) : <Chip label="No active open work orders" />}
          </Stack>
        </Box>
      )}
    </PageSurface>
  </Grid>
);
