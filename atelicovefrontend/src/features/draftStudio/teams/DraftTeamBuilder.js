import { Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

const workerLabel = (worker = {}) => (
  `${worker.firstName || worker.workerFName || ''} ${worker.lastName || worker.workerLName || ''}`.trim()
  || worker.workerDisplayName
  || worker.username
  || worker.workerUser
  || `Worker #${worker.workerID ?? worker.workerId}`
);

const DraftTeamBuilder = ({ selectedProject, workers = [], saving = false, onSaveDraftTeam }) => {
  const [teamName, setTeamName] = useState('');
  const [workerIDs, setWorkerIDs] = useState([]);

  const availableWorkers = useMemo(() => workers.filter(worker => !worker.archived), [workers]);

  const toggleWorker = (workerID) => {
    setWorkerIDs(current => current.includes(workerID)
      ? current.filter(id => id !== workerID)
      : [...current, workerID]);
  };

  const save = async () => {
    await onSaveDraftTeam?.({
      teamName: teamName.trim() || 'Planned Draft Team',
      workerIDs,
      projectID: selectedProject?.projectID,
      draftOnly: true,
    });
    setTeamName('');
    setWorkerIDs([]);
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Planned team name"
        value={teamName}
        onChange={event => setTeamName(event.target.value)}
        fullWidth
      />

      <Typography variant="body2" color="text.secondary">
        This creates a draft-only planned team snapshot for this draft project. It does not create a real Team record or worker/team history timestamps.
      </Typography>

      <Stack spacing={0.5} sx={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 1, p: 1 }}>
        {availableWorkers.map(worker => {
          const id = Number(worker.workerID ?? worker.workerId);
          return (
            <FormControlLabel
              key={id}
              control={<Checkbox checked={workerIDs.includes(id)} onChange={() => toggleWorker(id)} />}
              label={workerLabel(worker)}
            />
          );
        })}
        {!availableWorkers.length && (
          <Typography variant="body2" color="text.secondary">No workers available.</Typography>
        )}
      </Stack>

      <Button variant="contained" disabled={saving || !selectedProject || !workerIDs.length} onClick={save}>
        Save Planned Draft Team
      </Button>
    </Stack>
  );
};

export default DraftTeamBuilder;
