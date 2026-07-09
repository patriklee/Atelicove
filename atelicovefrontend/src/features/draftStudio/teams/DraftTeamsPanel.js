import { useState } from 'react';
import { Box, Button, ButtonGroup, Paper, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PlannedTeamsTable from './PlannedTeamsTable';
import DraftTeamBuilder from './DraftTeamBuilder';

const DraftTeamsPanel = ({
  selectedProject,
  teams = [],
  workers = [],
  selectedTeamIDs = [],
  saving = false,
  isDraftMode = false,
  onAddTeam,
  onRemoveTeam,
  onSaveDraftTeam,
}) => {
  const [view, setView] = useState('planned');
  const [editingDraftTeamID, setEditingDraftTeamID] = useState(null);

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <GroupsIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {isDraftMode ? 'Draft Project Teams' : 'Project Teams'}
            </Typography>
            {isDraftMode && (
              <Typography variant="body2" color="text.secondary">
                Plan teams without creating active worker/team history.
              </Typography>
            )}
          </Box>
        </Stack>

        {isDraftMode && (
          <ButtonGroup size="small">
            <Button
              variant={view === 'planned' ? 'contained' : 'outlined'}
              onClick={() => {
                setEditingDraftTeamID(null);
                setView('planned');
              }}
            >
              Add / Remove
            </Button>
            <Button
              variant={view === 'builder' ? 'contained' : 'outlined'}
              onClick={() => {
                setEditingDraftTeamID(null);
                setView('builder');
              }}
            >
              Build Team
            </Button>
          </ButtonGroup>
        )}
      </Stack>

      {view === 'builder' && isDraftMode ? (
        <DraftTeamBuilder
          selectedProject={selectedProject}
          teams={teams}
          workers={workers}
          saving={saving}
          editingDraftTeamID={editingDraftTeamID}
          onSaveDraftTeam={onSaveDraftTeam}
        />
      ) : (
        <PlannedTeamsTable
          selectedProject={selectedProject}
          teams={teams}
          selectedTeamIDs={selectedTeamIDs}
          saving={saving}
          isDraftMode={isDraftMode}
          onAddTeam={onAddTeam}
          onRemoveTeam={onRemoveTeam}
          onEditDraftTeam={(teamID) => {
            setEditingDraftTeamID(teamID);
            setView('builder');
          }}
        />
      )}
    </Paper>
  );
};

export default DraftTeamsPanel;
