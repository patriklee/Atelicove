import React from 'react';
import {
  Button,
  Checkbox,
  FormControl,
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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import SaveIcon from '@mui/icons-material/Save';

const ProjectActionItemsPanel = ({
  selectedProject,
  isWorkerEdit,
  isStudioEditView,
  saving,
  actionItemForm,
  emptyActionItemForm,
  workers,
  teams,
  canManageProject,
  workerName,
  actionItemAssigneeName,
  isEditingActionItem,
  onActionItemFormChange,
  onSaveActionItem,
  onResetActionItemForm,
  onLoadActionItemIntoForm,
  onRemoveActionItem,
  onSetActionItemCompleted,
}) => {
  if (!selectedProject) return null;

  return (
    <Paper sx={{ p: 3, mt: isWorkerEdit ? 0 : 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PlaylistAddCheckIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {isStudioEditView ? 'Draft Action Items' : 'Action Items'}
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={saving || selectedProject.archived || selectedProject.projectStatus === 'COMPLETED'}
          onClick={() => onActionItemFormChange({ ...emptyActionItemForm, projectID: selectedProject.projectID })}
        >
          Add Action Item
        </Button>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Done</TableCell>
              <TableCell>Action Item</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isEditingActionItem && (
              <TableRow>
                <TableCell />
                <TableCell>
                  <TextField
                    label="Action item"
                    fullWidth
                    size="small"
                    value={actionItemForm.itemText}
                    onChange={event => onActionItemFormChange(current => ({ ...current, itemText: event.target.value }))}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Worker</InputLabel>
                      <Select
                        value={actionItemForm.assignedWorkerID}
                        label="Worker"
                        onChange={event => onActionItemFormChange(current => ({ ...current, assignedWorkerID: event.target.value, assignedTeamID: event.target.value ? '' : current.assignedTeamID }))}
                      >
                        <MenuItem value="">No worker</MenuItem>
                        {workers.map(worker => (
                          <MenuItem key={worker.workerID} value={worker.workerID}>{workerName(worker)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Team</InputLabel>
                      <Select
                        value={actionItemForm.assignedTeamID}
                        label="Team"
                        onChange={event => onActionItemFormChange(current => ({ ...current, assignedTeamID: event.target.value, assignedWorkerID: event.target.value ? '' : current.assignedWorkerID }))}
                      >
                        <MenuItem value="">No team</MenuItem>
                        {teams.map(team => (
                          <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="contained" size="small" startIcon={<SaveIcon />} disabled={saving || !actionItemForm.itemText.trim()} onClick={onSaveActionItem}>
                      {actionItemForm.actionItemID ? 'Save Action Item' : 'Save'}
                    </Button>
                    <Button variant="outlined" size="small" onClick={onResetActionItemForm}>
                      Cancel
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
            {(selectedProject.actionItems || []).map(item => (
              <TableRow key={item.actionItemID} hover>
                <TableCell>
                  <Checkbox
                    size="small"
                    checked={Boolean(item.completed)}
                    disabled={saving || selectedProject.projectStatus === 'COMPLETED' || selectedProject.archived}
                    onChange={event => onSetActionItemCompleted(selectedProject, item, event.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
                    {item.itemText}
                  </Typography>
                </TableCell>
                <TableCell>{actionItemAssigneeName(item)}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} disabled={saving || selectedProject.archived || selectedProject.projectStatus === 'COMPLETED'} onClick={() => onLoadActionItemIntoForm(selectedProject, item)}>
                      Edit
                    </Button>
                    {canManageProject && (
                      <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={saving} onClick={() => onRemoveActionItem(selectedProject.projectID, item.actionItemID)}>
                        Delete
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!(selectedProject.actionItems || []).length && !isEditingActionItem && (
              <TableRow>
                <TableCell colSpan={4}>No action items for this project.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ProjectActionItemsPanel;
