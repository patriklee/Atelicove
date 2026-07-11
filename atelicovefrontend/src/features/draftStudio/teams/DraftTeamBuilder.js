import {
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

const workerLabel = (worker = {}) => (
  `${worker.firstName || worker.workerFName || ''} ${worker.lastName || worker.workerLName || ''}`.trim()
  || worker.workerDisplayName
  || worker.username
  || worker.workerUser
  || `Worker #${worker.workerID ?? worker.workerId}`
);

const workerRole = (worker = {}) => worker.roleTitle || worker.role || worker.roleDescription || '';

const DraftTeamBuilder = ({
  selectedProject,
  teams = [],
  workers = [],
  saving = false,
  editingDraftTeamID = null,
  onSaveDraftTeam,
}) => {
  const [teamName, setTeamName] = useState('');
  const [workerIDs, setWorkerIDs] = useState([]);
  const [sourceTeamIDs, setSourceTeamIDs] = useState([]);
  const [templateTeam, setTemplateTeam] = useState('');

  const availableWorkers = useMemo(() => workers.filter(worker => !worker.archived), [workers]);
  const availableTeams = useMemo(() => teams.filter(team => (team.workers || []).length), [teams]);
  const draftedTeams = useMemo(() => (
    selectedProject?.projectStatus === 'OPEN' ? (selectedProject?.plannedTeams || []) : []
  ), [selectedProject]);

  const workersByID = useMemo(() => {
    const byID = new Map();

    [...availableWorkers, ...availableTeams.flatMap(team => team.workers || []), ...draftedTeams.flatMap(team => team.workers || [])]
      .forEach(worker => {
        const id = Number(worker.workerID ?? worker.workerId);
        if (Number.isFinite(id)) {
          byID.set(id, worker);
        }
      });

    return byID;
  }, [availableTeams, availableWorkers, draftedTeams]);

  const selectedWorkers = useMemo(() => {
    return workerIDs.map(id => workersByID.get(Number(id))).filter(Boolean);
  }, [workerIDs, workersByID]);

  const addWorkerIDs = (ids) => {
    setWorkerIDs(current => Array.from(new Set([...current, ...ids.map(Number).filter(Number.isFinite)])));
  };

  const workerIDsForTeam = (team) => (
    (team?.workers || [])
      .map(worker => Number(worker.workerID ?? worker.workerId))
      .filter(Number.isFinite)
  );

  useEffect(() => {
    if (!editingDraftTeamID) return;

    const draftTeam = draftedTeams.find(
      team => Number(team.teamID) === Number(editingDraftTeamID)
    );

    if (!draftTeam) return;

    setTemplateTeam(`draft:${draftTeam.teamID}`);
    setTeamName(draftTeam.teamName || '');
    setWorkerIDs(workerIDsForTeam(draftTeam));
    setSourceTeamIDs([]);
  }, [editingDraftTeamID, draftedTeams]);

  const applyTemplate = (value) => {
    setTemplateTeam(value);

    if (!value) {
      setTeamName('');
      setWorkerIDs([]);
      setSourceTeamIDs([]);
      return;
    }

    const [type, rawID] = String(value).split(':');
    const source = type === 'draft'
      ? draftedTeams.find(team => Number(team.teamID) === Number(rawID))
      : availableTeams.find(team => Number(team.teamID) === Number(rawID));

    if (!source) {
      return;
    }

    setTeamName(source.teamName || '');
    setWorkerIDs(workerIDsForTeam(source));
    setSourceTeamIDs(type === 'active' ? [Number(source.teamID)] : []);
  };

  const updateSourceTeams = (selectedIDs) => {
    const values = Array.isArray(selectedIDs) ? selectedIDs : String(selectedIDs).split(',');
    const numericIDs = values.map(Number).filter(Number.isFinite);

    setSourceTeamIDs(numericIDs);

    const sourceWorkerIDs = numericIDs
      .map(id => availableTeams.find(team => Number(team.teamID) === Number(id)))
      .filter(Boolean)
      .flatMap(workerIDsForTeam);

    addWorkerIDs(sourceWorkerIDs);
  };

  const toggleWorker = (workerID) => {
    setWorkerIDs(current => current.includes(workerID)
      ? current.filter(id => id !== workerID)
      : [...current, workerID]);
  };

  const removeSelectedWorker = (workerID) => {
    setWorkerIDs(current => current.filter(id => id !== workerID));
  };

  const save = async () => {
    const selectedDraftTeamID = templateTeam.startsWith('draft:')
      ? Number(templateTeam.split(':')[1])
      : null;

    await onSaveDraftTeam?.({
      teamID: selectedDraftTeamID || -Date.now(),
      sourceDraftTeamID: selectedDraftTeamID,
      teamName: teamName.trim() || 'Planned Staffing',
      workerIDs: selectedWorkers.map(worker => Number(worker.workerID ?? worker.workerId)),
      sourceTeamIDs,
      projectID: selectedProject?.projectID,
      draftOnly: true,
    });

    setTeamName('');
    setWorkerIDs([]);
    setSourceTeamIDs([]);
    setTemplateTeam('');
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Planned staffing name"
        value={teamName}
        onChange={event => setTeamName(event.target.value)}
        fullWidth
      />

      <Typography variant="body2" color="text.secondary">
        This creates draft-only planned staffing from existing workers or empty staffing slots. It does not create a live team or worker history timestamps.
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel>Select planned staffing to edit</InputLabel>
        <Select
          value={templateTeam}
          label="Select planned staffing to edit"
          onChange={event => applyTemplate(event.target.value)}
        >
          <MenuItem value="">Blank planned staffing</MenuItem>
          {draftedTeams.length > 0 && (
            <MenuItem disabled>Existing planned staffing</MenuItem>
          )}
          {draftedTeams.map(team => (
            <MenuItem key={`draft-${team.teamID}`} value={`draft:${team.teamID}`}>
              {team.teamName || `Planned staffing #${team.teamID}`}
            </MenuItem>
          ))}
          {availableTeams.length > 0 && (
            <MenuItem disabled>Existing active teams</MenuItem>
          )}
          {availableTeams.map(team => (
            <MenuItem key={`active-${team.teamID}`} value={`active:${team.teamID}`}>
              {team.teamName || `Team #${team.teamID}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel>Use workers from teams</InputLabel>
        <Select
          multiple
          value={sourceTeamIDs}
          label="Use workers from teams"
          onChange={event => {
            updateSourceTeams(event.target.value);
          }}
          renderValue={selected => selected
            .map(teamID => availableTeams.find(team => Number(team.teamID) === Number(teamID))?.teamName || `Team #${teamID}`)
            .join(', ')}
        >
          {availableTeams.map(team => (
            <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack spacing={0.5} sx={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 1, p: 1 }}>
        {availableWorkers.map(worker => {
          const id = Number(worker.workerID ?? worker.workerId);
          return (
            <FormControlLabel
              key={id}
              control={<Checkbox checked={workerIDs.includes(id)} onChange={() => toggleWorker(id)} />}
                label={workerRole(worker) ? `${workerLabel(worker)} - ${workerRole(worker)}` : workerLabel(worker)}
            />
          );
        })}
        {!availableWorkers.length && (
          <Typography variant="body2" color="text.secondary">No workers available.</Typography>
        )}
      </Stack>

      <Stack spacing={1} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1 }}>
        <Typography variant="subtitle2">Staffing slots</Typography>
        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
          {selectedWorkers.map(worker => {
            const id = Number(worker.workerID ?? worker.workerId);
            return (
              <Chip key={id} label={workerRole(worker) ? `${workerLabel(worker)} - ${workerRole(worker)}` : workerLabel(worker)} onDelete={() => removeSelectedWorker(id)} />
            );
          })}
          {!selectedWorkers.length && (
            <Typography variant="body2" color="text.secondary">No workers selected. Save empty staffing to fill later.</Typography>
          )}
        </Stack>
      </Stack>

      <Button variant="contained" disabled={saving || !selectedProject} onClick={save}>
        {templateTeam.startsWith('draft:') ? 'Update Planned Staffing' : 'Save Planned Staffing'}
      </Button>
    </Stack>
  );
};

export default DraftTeamBuilder;
