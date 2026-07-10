import { useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Divider, Paper, Stack, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssociatedWorkOrdersTable from './AssociatedWorkOrdersTable';
import DraftWorkOrderAttachForm from './DraftWorkOrderAttachForm';

const allAssociatedWorkOrders = (project = {}) => [
  ...(project.workOrders || []),
  ...(project.draftWorkOrders || []),
].filter(workOrder => !workOrder.archived);

const DraftWorkOrdersPanel = ({
  selectedProject,
  projects = [],
  workOrderForm = {},
  attachableWorkOrders = [],
  teams = [],
  companies = [],
  saving = false,
  onWorkOrderFormChange,
  onSaveWorkOrder,
  onEditWorkOrder,
  onRemoveWorkOrder,
  getTeamName,
}) => {
  const [view, setView] = useState('list');
  const associatedWorkOrders = useMemo(() => allAssociatedWorkOrders(selectedProject), [selectedProject]);

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AssignmentIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Draft Work Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plan work orders without turning them into active project execution until launch.
            </Typography>
          </Box>
        </Stack>

        <ButtonGroup size="small">
          <Button variant={view === 'list' ? 'contained' : 'outlined'} onClick={() => setView('list')}>
            Associated
          </Button>
          <Button variant={view === 'form' ? 'contained' : 'outlined'} onClick={() => setView('form')}>
            Add / Attach
          </Button>
        </ButtonGroup>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {view === 'form' ? (
        <DraftWorkOrderAttachForm
          form={workOrderForm}
          projects={projects}
          attachableWorkOrders={attachableWorkOrders}
          teams={teams}
          companies={companies}
          saving={saving}
          onChange={onWorkOrderFormChange}
          onSubmit={onSaveWorkOrder}
        />
      ) : (
        <AssociatedWorkOrdersTable
          project={selectedProject}
          workOrders={associatedWorkOrders}
          saving={saving}
          onEditWorkOrder={onEditWorkOrder}
          onRemoveWorkOrder={onRemoveWorkOrder}
          getTeamName={getTeamName}
        />
      )}
    </Paper>
  );
};

export default DraftWorkOrdersPanel;
