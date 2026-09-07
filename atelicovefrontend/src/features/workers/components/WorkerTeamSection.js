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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { normalizeWorker } from '../../../model';
import { PageSurface } from '../../../shared/components/layout';
import { EntityEmptyState, TableTitleRow } from '../../../shared/components/tables';
import { AppSelect } from '../../../shared/icons';

const WorkerTeamSection = ({
  teams,
  workers,
  teamForm,
  selectedTeam,
  saving,
  onSelectTeam,
  onFormChange,
  onReset,
  onSave,
  onDelete,
  onShowSummary,
}) => (
  <Grid container spacing={3} alignItems="stretch">
    <Grid item xs={12} md={6}>
      <PageSurface component="form" onSubmit={onSave} sx={{ height: '100%' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          {teamForm.teamID ? 'Edit Team' : 'Create Team'}
        </Typography>
        <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel>Edit team</InputLabel>
          <AppSelect value={teamForm.teamID} label="Edit team" onChange={event => onSelectTeam(event.target.value)}>
            <MenuItem value="">New team</MenuItem>
            {teams.map(team => (
              <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>
            ))}
          </AppSelect>
        </FormControl>
        <TextField
          label="Team name"
          fullWidth
          value={teamForm.teamName}
          onChange={event => onFormChange({ teamName: event.target.value })}
        />
        <FormControl fullWidth>
          <InputLabel>Workers</InputLabel>
          <AppSelect
            multiple
            value={teamForm.workerIDs}
            label="Workers"
            onChange={event => onFormChange({ workerIDs: event.target.value })}
            renderValue={selected => selected.map(workerID => {
              const worker = workers.find(item => item.workerID === Number(workerID));
              return worker ? `${worker.firstName} ${worker.lastName}` : `Worker #${workerID}`;
            }).join(', ')}
          >
            {workers.map(worker => (
              <MenuItem key={worker.workerID} value={worker.workerID}>{worker.firstName} {worker.lastName}</MenuItem>
            ))}
          </AppSelect>
        </FormControl>
        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained" disabled={saving || !teamForm.teamName.trim() || !teamForm.workerIDs.length}>
            Save Team
          </Button>
          <Button variant="outlined" disabled={Boolean(teamForm.teamID)} onClick={onReset}>New</Button>
          {selectedTeam && (
            <Button variant="outlined" color="error" disabled={saving} onClick={() => onDelete(selectedTeam)}>
              Delete
            </Button>
          )}
        </Stack>
        </Stack>
      </PageSurface>
    </Grid>

    <Grid item xs={12} md={6}>
      <PageSurface sx={{ height: '100%' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Team Preview</Typography>
        {selectedTeam ? (
          <Box>
            <Typography variant="subtitle1">{selectedTeam.teamName}</Typography>
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              {(selectedTeam.workers || []).map(worker => {
                const normalized = normalizeWorker(worker);
                return <Chip key={normalized.workerID} label={`${normalized.firstName} ${normalized.lastName}`} />;
              })}
            </Stack>
          </Box>
        ) : (
          <Typography color="text.secondary">Select a team from the list below to edit it.</Typography>
        )}
      </PageSurface>
    </Grid>

    <Grid item xs={12}>
      <PageSurface>
        <TableContainer sx={{ maxHeight: 360, overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableTitleRow title="Teams" colSpan={4} />
              <TableRow>
                <TableCell>Team</TableCell>
                <TableCell>People</TableCell>
                <TableCell>Workers</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map(team => (
                <TableRow key={team.teamID} hover>
                  <TableCell>
                    <Button size="small" onClick={() => onShowSummary(team)}>{team.teamName || `Team #${team.teamID}`}</Button>
                  </TableCell>
                  <TableCell>{(team.workers || []).length}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                      {(team.workers || []).map(worker => {
                        const normalized = normalizeWorker(worker);
                        return <Chip key={normalized.workerID} size="small" label={`${normalized.firstName} ${normalized.lastName}`} />;
                      })}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" disabled={saving} onClick={() => onDelete(team)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!teams.length && <EntityEmptyState message="No teams found." colSpan={4} />}
            </TableBody>
          </Table>
        </TableContainer>
      </PageSurface>
    </Grid>
  </Grid>
);

export default WorkerTeamSection;
