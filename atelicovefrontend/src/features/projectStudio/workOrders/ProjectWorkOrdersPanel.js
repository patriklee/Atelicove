import React from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { formatMoney } from '../../projects/projectUtils';

export default function ProjectWorkOrdersPanel({
  selectedWorkOrderProject,
  workOrderForm,
  attachableWorkOrders = [],
  assignableTeams = [],
  companies = [],
  saving = false,
  associatedWorkOrdersFor,
  teamForWorkOrder,
  workersOutsideWorkOrderTeam,
  workOrderTeamName,
  workOrderCost,
  onSubmit,
  onWorkOrderFormChange,
  onOpenWorkOrderTeams,
  onEditAssociatedWorkOrder,
  onRemoveAssociatedWorkOrder,
}) {
  const associatedWorkOrders = selectedWorkOrderProject && associatedWorkOrdersFor
    ? associatedWorkOrdersFor(selectedWorkOrderProject)
    : [];

  const handleExistingWorkOrderChange = event => {
    const value = event.target.value;
    onWorkOrderFormChange(current => ({
      ...current,
      existingWorkOrderID: value,
      teamID: value ? '' : current.teamID,
      companyID: value ? '' : current.companyID,
    }));
  };

  return (
    <Paper component="form" onSubmit={onSubmit} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {selectedWorkOrderProject?.projectStatus === 'ACTIVE' ? 'Work Orders For Project' : 'Draft Work Orders For Project'}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Attach existing work order</InputLabel>
            <Select
              value={workOrderForm.existingWorkOrderID}
              label="Attach existing work order"
              onChange={handleExistingWorkOrderChange}
            >
              <MenuItem value="">Create new</MenuItem>
              {attachableWorkOrders.map(workOrder => (
                <MenuItem key={workOrder.workOrderID} value={workOrder.workOrderID}>
                  #{workOrder.workOrderID} - {workOrder.company?.companyName || 'No company'} ({workOrder.status.replaceAll('_', ' ')})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Team</InputLabel>
            <Select
              value={workOrderForm.teamID}
              label="Team"
              disabled={Boolean(workOrderForm.existingWorkOrderID)}
              onChange={event => onWorkOrderFormChange(current => ({ ...current, teamID: event.target.value }))}
            >
              <MenuItem value="">
                {selectedWorkOrderProject?.projectStatus === 'ACTIVE' ? 'No team selected (open)' : 'No team selected'}
              </MenuItem>
              {assignableTeams.map(team => (
                <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Company</InputLabel>
            <Select
              value={workOrderForm.companyID}
              label="Company"
              disabled={Boolean(workOrderForm.existingWorkOrderID)}
              onChange={event => onWorkOrderFormChange(current => ({ ...current, companyID: event.target.value }))}
            >
              <MenuItem value="">No company selected</MenuItem>
              {companies.map(company => (
                <MenuItem key={company.companyID} value={company.companyID}>{company.companyName || `Company #${company.companyID}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            label={selectedWorkOrderProject?.projectStatus === 'DRAFT' ? 'Draft work order note' : 'Work order note'}
            fullWidth
            multiline
            minRows={2}
            value={workOrderForm.comment}
            onChange={event => onWorkOrderFormChange(current => ({ ...current, comment: event.target.value }))}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        startIcon={<AddIcon />}
        sx={{ mt: 2 }}
        disabled={
          saving ||
          !workOrderForm.projectID ||
          (selectedWorkOrderProject?.projectStatus === 'DRAFT' && !workOrderForm.teamID && !workOrderForm.existingWorkOrderID) ||
          !['DRAFT', 'ACTIVE'].includes(selectedWorkOrderProject?.projectStatus)
        }
      >
        {workOrderForm.existingWorkOrderID
          ? (selectedWorkOrderProject?.projectStatus === 'DRAFT' ? 'Create Draft Copy' : 'Attach Work Order')
          : (selectedWorkOrderProject?.projectStatus === 'ACTIVE' ? 'Create Work Order' : 'Create Draft')}
      </Button>

      {selectedWorkOrderProject && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Associated Work Orders</Typography>
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Work Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {associatedWorkOrders.map(workOrder => {
                  const team = teamForWorkOrder(selectedWorkOrderProject, workOrder);
                  const workersOutsideTeam = workersOutsideWorkOrderTeam(selectedWorkOrderProject, workOrder);
                  return (
                    <TableRow key={`${workOrder.status || 'UNKNOWN'}-${workOrder.workOrderID}`}>
                      <TableCell>#{workOrder.workOrderID}</TableCell>
                      <TableCell>{(workOrder.status || 'UNKNOWN').replaceAll('_', ' ')}</TableCell>
                      <TableCell>{workOrder.company?.companyName || workOrder.plannedCompanyName || 'No company'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onOpenWorkOrderTeams({ workOrder, team, workersOutsideTeam })}
                        >
                          {workOrderTeamName(selectedWorkOrderProject, workOrder)}
                        </Button>
                      </TableCell>
                      <TableCell align="right">{formatMoney(workOrderCost(workOrder))}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" onClick={() => onEditAssociatedWorkOrder(selectedWorkOrderProject, workOrder)}>
                            Manage
                          </Button>
                          <Button size="small" variant="outlined" color="error" disabled={saving} onClick={() => onRemoveAssociatedWorkOrder(selectedWorkOrderProject, workOrder)}>
                            Remove
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!associatedWorkOrders.length && (
                  <TableRow>
                    <TableCell colSpan={6}>No work orders for this project.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
}
