import React from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const WorkOrderCreateForm = ({ form, workers, companies, saving, onChange, onSubmit }) => (
  <Paper component="form" onSubmit={onSubmit} sx={{ p: 3, mb: 4 }}>
    <Typography variant="h5" sx={{ mb: 2 }}>Create Work Order</Typography>
    <Stack spacing={2}>
      <FormControl>
        <InputLabel>Workers</InputLabel>
        <Select multiple value={form.workerIDs} label="Workers" onChange={event => onChange({ workerIDs: event.target.value })}>
          {workers.map(worker => <MenuItem key={worker.workerID} value={worker.workerID}>{worker.firstName} {worker.lastName}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel>Company</InputLabel>
        <Select value={form.companyID} label="Company" onChange={event => onChange({ companyID: event.target.value })}>
          <MenuItem value="">No company</MenuItem>
          {companies.map(company => <MenuItem key={company.companyID} value={company.companyID}>{company.companyName}</MenuItem>)}
        </Select>
      </FormControl>
      <TextField label="Work order note" value={form.comment} onChange={event => onChange({ comment: event.target.value })} multiline minRows={2} />
      <Button type="submit" variant="contained" disabled={saving}>Create</Button>
    </Stack>
  </Paper>
);

export default WorkOrderCreateForm;
