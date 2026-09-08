import React from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { formatMoney, getWorkOrderActualPrice } from '../../../model';
import { PageSurface } from '../../../shared/components/layout';
import { AppSelect } from '../../../shared/icons';

export default function ProjectWorkOrders({
  project,
  canManage,
  form,
  workOrders,
  teams,
  companies,
  saving,
  onFormChange,
  onOpen,
  onRemove,
  onSubmit,
}) {
  return (
    <PageSurface>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Project Work Orders
      </Typography>

      {(project.workOrders || []).map(order => (
        <Stack
          key={order.workOrderID}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ py: 1 }}
        >
          <Typography>
            #{order.workOrderID} · {(order.status || 'OPEN').replaceAll('_', ' ')} ·{' '}
            {formatMoney(getWorkOrderActualPrice(order))}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => onOpen(order)}>Open</Button>
            {canManage && (
              <Button size="small" color="error" onClick={() => onRemove(order.workOrderID)}>
                Remove
              </Button>
            )}
          </Stack>
        </Stack>
      ))}

      {!(project.workOrders || []).length && (
        <Typography color="text.secondary">
          No work orders are associated with this project.
        </Typography>
      )}

      {canManage && (
        <Stack component="form" onSubmit={onSubmit} spacing={2} sx={{ mt: 3 }}>
          <FormControl>
            <InputLabel>Existing Work Order</InputLabel>
            <AppSelect
              value={form.existingWorkOrderID}
              label="Existing Work Order"
              onChange={event => onFormChange({ existingWorkOrderID: event.target.value })}
            >
              <MenuItem value="">Create new</MenuItem>
              {workOrders.map(order => (
                <MenuItem key={order.workOrderID} value={order.workOrderID}>
                  #{order.workOrderID}
                </MenuItem>
              ))}
            </AppSelect>
          </FormControl>

          {!form.existingWorkOrderID && (
            <>
              <FormControl>
                <InputLabel>Team</InputLabel>
                <AppSelect
                  value={form.teamID}
                  label="Team"
                  onChange={event => onFormChange({ teamID: event.target.value })}
                >
                  <MenuItem value="">No team</MenuItem>
                  {teams.map(team => (
                    <MenuItem key={team.teamID} value={team.teamID}>{team.teamName}</MenuItem>
                  ))}
                </AppSelect>
              </FormControl>
              <FormControl>
                <InputLabel>Company</InputLabel>
                <AppSelect
                  value={form.companyID}
                  label="Company"
                  onChange={event => onFormChange({ companyID: event.target.value })}
                >
                  <MenuItem value="">No company</MenuItem>
                  {companies.map(company => (
                    <MenuItem key={company.companyID} value={company.companyID}>
                      {company.companyName}
                    </MenuItem>
                  ))}
                </AppSelect>
              </FormControl>
              <TextField
                label="Work order note"
                value={form.comment}
                onChange={event => onFormChange({ comment: event.target.value })}
                multiline
                minRows={2}
              />
            </>
          )}

          <Button type="submit" variant="contained" disabled={saving}>
            {form.existingWorkOrderID ? 'Attach Work Order' : 'Create Work Order'}
          </Button>
        </Stack>
      )}
    </PageSurface>
  );
}
