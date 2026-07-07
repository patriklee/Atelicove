import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

const teamLabel = (team) => team?.teamName || `Team #${team?.teamID}`;

const workerLabel = (worker = {}) => (
  `${worker.firstName || worker.workerFName || ''} ${worker.lastName || worker.workerLName || ''}`.trim()
  || worker.workerDisplayName
  || worker.username
  || worker.workerUser
  || `Worker #${worker.workerID ?? worker.workerId}`
);

const PlannedTeamsTable = ({
  selectedProject,
  teams = [],
  selectedTeamIDs = [],
  saving = false,
  isDraftMode = false,
  onAddTeam,
  onRemoveTeam,
}) => {
  const [teamID, setTeamID] = useState('');

  const plannedTeams = useMemo(() => {
    const snapshots = selectedProject?.projectStatus === 'DRAFT'
      ? (selectedProject?.plannedTeams || [])
      : (selectedProject?.teams || []);

    const byID = new Map();
    [...teams, ...snapshots].forEach(team => {
      if (team?.teamID !== undefined && team?.teamID !== null) {
        byID.set(Number(team.teamID), team);
      }
    });

    const ids = selectedTeamIDs.length
      ? selectedTeamIDs.map(Number)
      : snapshots.map(team => Number(team.teamID));

    return ids.map(id => byID.get(Number(id))).filter(Boolean);
  }, [selectedProject, selectedTeamIDs, teams]);

  const availableTeams = teams.filter(team => (
    (team.workers || []).length && !plannedTeams.some(planned => Number(planned.teamID) === Number(team.teamID))
  ));

  const add = () => {
    onAddTeam?.(teamID);
    setTeamID('');
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <FormControl fullWidth size="small">
          <InputLabel>{isDraftMode ? 'Add existing team as plan' : 'Add existing team'}</InputLabel>
          <Select
            value={teamID}
            label={isDraftMode ? 'Add existing team as plan' : 'Add existing team'}
            onChange={event => setTeamID(event.target.value)}
          >
            <MenuItem value="">Select team</MenuItem>
            {availableTeams.map(team => (
              <MenuItem key={team.teamID} value={team.teamID}>{teamLabel(team)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" disabled={saving || !teamID} onClick={add}>Add</Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{isDraftMode ? 'Planned Team' : 'Team'}</TableCell>
            <TableCell>Workers</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {plannedTeams.map(team => (
            <TableRow key={team.teamID}>
              <TableCell>
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{teamLabel(team)}</Typography>
                  {Number(team.teamID) < 0 && <Chip size="small" label="Draft-only" sx={{ width: 'fit-content' }} />}
                </Stack>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(team.workers || []).map(worker => (
                    <Chip key={worker.workerID ?? worker.workerId} size="small" label={workerLabel(worker)} />
                  ))}
                  {!(team.workers || []).length && (
                    <Typography variant="body2" color="text.secondary">No workers planned</Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell align="right">
                <Button size="small" color="error" disabled={saving} onClick={() => onRemoveTeam?.(team.teamID)}>
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!plannedTeams.length && (
            <TableRow>
              <TableCell colSpan={3}>
                <Typography color="text.secondary">
                  {isDraftMode ? 'No planned teams are saved for this draft project.' : 'No teams are attached to this project.'}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Stack>
  );
};

export default PlannedTeamsTable;
