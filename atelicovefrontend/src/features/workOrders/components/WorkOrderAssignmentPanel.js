import React from 'react';
import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { getWorkOrderWorkers } from '../../../model';
import { AppIcon, AppSelect, ICON_SIZES, icons } from '../../../shared/icons';

const WorkOrderAssignmentPanel = ({
  workOrders,
  selected,
  selectedID,
  workers,
  companies,
  workerID,
  companyID,
  saving,
  onSelectWorkOrder,
  onWorkerChange,
  onCompanyChange,
  onAddWorker,
  onRemoveWorker,
  onAssignCompany,
  onRemoveCompany,
}) => {
  const assignedWorkerIDs = new Set(getWorkOrderWorkers(selected || {}).map(worker => worker.workerID));

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Modify Assignments</Typography>
      <Stack spacing={2}>
        <FormControl>
          <InputLabel>Work Order</InputLabel>
          <AppSelect value={selectedID} label="Work Order" onChange={event => onSelectWorkOrder(event.target.value)}>
            <MenuItem value="">Select a work order</MenuItem>
            {workOrders.filter(order => !['COMPLETE', 'IN_REVIEW'].includes(order.status)).map(order => (
              <MenuItem key={order.workOrderID} value={order.workOrderID}>
                #{order.workOrderID} Â· {(order.status || 'OPEN').replaceAll('_', ' ')}
              </MenuItem>
            ))}
          </AppSelect>
        </FormControl>
        {selected && (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <FormControl fullWidth>
                <InputLabel>Add Worker</InputLabel>
                <AppSelect value={workerID} label="Add Worker" onChange={event => onWorkerChange(event.target.value)}>
                  <MenuItem value="">Select worker</MenuItem>
                  {workers.filter(worker => !assignedWorkerIDs.has(worker.workerID)).map(worker => (
                    <MenuItem key={worker.workerID} value={worker.workerID}>{worker.firstName} {worker.lastName}</MenuItem>
                  ))}
                </AppSelect>
              </FormControl>
              <Button variant="outlined" onClick={onAddWorker} disabled={!workerID || saving}>Assign</Button>
            </Stack>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {getWorkOrderWorkers(selected).map(worker => (
                <Chip
                  key={worker.workerID}
                  label={`${worker.firstName} ${worker.lastName}`}
                  onDelete={() => onRemoveWorker(worker.workerID)}
                  deleteIcon={<AppIcon icon={icons.close} size={ICON_SIZES.compact} />}
                />
              ))}
              {!getWorkOrderWorkers(selected).length && <Chip label="No assigned workers" />}
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <FormControl fullWidth>
                <InputLabel>Company</InputLabel>
                <AppSelect value={companyID} label="Company" onChange={event => onCompanyChange(event.target.value)}>
                  <MenuItem value="">Select company</MenuItem>
                  {companies.map(company => <MenuItem key={company.companyID} value={company.companyID}>{company.companyName}</MenuItem>)}
                </AppSelect>
              </FormControl>
              <Button variant="outlined" onClick={onAssignCompany} disabled={!companyID || saving}>Assign</Button>
              <Button color="warning" onClick={onRemoveCompany} disabled={!selected.company || saving}>Remove Current</Button>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
};

export default WorkOrderAssignmentPanel;
