import React from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AppSelect } from '../../../shared/icons';
import { PageSurface } from '../../../shared/components/layout';

const CompanyFields = ({ form, onChange, disabled = false }) => (
  <Stack spacing={2}>
    <TextField label="Company Name" name="companyName" value={form.companyName} onChange={onChange} fullWidth disabled={disabled} />
    <TextField label="Address" name="companyAddress" value={form.companyAddress} onChange={onChange} fullWidth disabled={disabled} />
    <TextField label="Phone Number" name="companyPhone" value={form.companyPhone} onChange={onChange} fullWidth disabled={disabled} />
    <TextField label="Email" name="companyEmail" value={form.companyEmail} onChange={onChange} fullWidth disabled={disabled} />
  </Stack>
);

export const CompanyCreatePanel = ({ form, saving, onChange, onSubmit }) => (
  <Grid item xs={12} md={6}>
    <PageSurface component="form" onSubmit={onSubmit} sx={{ height: '100%' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Create Company</Typography>
      <CompanyFields form={form} onChange={onChange} />
      <Button type="submit" variant="contained" disabled={saving || !form.companyName.trim()} sx={{ mt: 2 }}>
        {saving ? 'Creating...' : 'Create'}
      </Button>
    </PageSurface>
  </Grid>
);

export const CompanyEditPanel = ({
  companies,
  companyID,
  form,
  selectedCompany,
  attachedWorkOrders,
  canDelete,
  saving,
  onCompanyChange,
  onChange,
  onUpdate,
  onDelete,
  onOpenWorkOrder,
}) => (
  <Grid item xs={12} md={6}>
    <PageSurface sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Edit Company</Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Company</InputLabel>
        <AppSelect value={selectedCompany ? companyID : ''} label="Company" onChange={event => onCompanyChange(event.target.value)}>
          <MenuItem value="">No company selected</MenuItem>
          {companies.map(company => (
            <MenuItem key={company.companyID} value={company.companyID}>{company.companyName}</MenuItem>
          ))}
        </AppSelect>
      </FormControl>
      <CompanyFields form={form} onChange={onChange} disabled={!selectedCompany} />
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          disabled={saving || !selectedCompany || !form.companyName.trim()}
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
      {selectedCompany && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Attached Work Orders</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {attachedWorkOrders.length ? attachedWorkOrders.map(order => (
              <Chip
                key={order.workOrderID}
                label={`#${order.workOrderID} (${order.status?.replaceAll('_', ' ')}${order.archived ? ', archived' : ''})`}
                onClick={() => onOpenWorkOrder(order)}
                clickable
              />
            )) : <Chip label="No attached work orders" />}
          </Stack>
        </Box>
      )}
    </PageSurface>
  </Grid>
);
