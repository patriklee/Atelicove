import React from 'react';
import {
  Alert,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SaveIcon from '@mui/icons-material/Save';

/**
 * ProjectEditorForm owns the project identity/editing controls for both studios.
 *
 * It intentionally receives state and handlers from ProjectsPage for now. That keeps this
 * phase low-risk while moving a large JSX section out of the god component. A later hook
 * phase can move the state orchestration into useProjectEditor/useDraftProjects.
 */
const ProjectEditorForm = ({
  draftStudioLabel,
  isStudioEditView,
  isProjectStudioEditView,
  isActiveProjectEditor,
  isEditorView,
  showCreationStudio,
  selectedProject,
  projectForm,
  projects,
  teams,
  projectTeamSelectOptions,
  activeProjectOptions,
  saving,
  onSubmit,
  onProjectFormChange,
  onLoadProject,
  onClearLoadedProject,
  onLaunchProject,
  onArchiveDraftProject,
  onDeleteDraftProject,
  onSubmitForReview,
  formatMoney,
  projectWorkOrdersAreComplete,
  projectHasEmptyAssociatedTeam,
  emptyProjectTeamNames,
}) => {
  const updateProjectForm = (updates) => {
    onProjectFormChange(current => ({ ...current, ...updates }));
  };

  return (
    <Paper component="form" onSubmit={onSubmit} sx={{ p: 3, height: '100%' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <EditIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{draftStudioLabel}</Typography>
      </Stack>

      <Grid container spacing={2}>
        {(isStudioEditView || isProjectStudioEditView) && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{isProjectStudioEditView ? 'Active Project' : 'Draft Project'}</InputLabel>
              <Select
                value={projectForm.projectID}
                label={isProjectStudioEditView ? 'Active Project' : 'Draft Project'}
                onChange={event => {
                  const project = projects.find(item => item.projectID === Number(event.target.value));
                  if (project) {
                    onLoadProject(project);
                  } else {
                    onClearLoadedProject();
                  }
                }}
              >
                <MenuItem value="">{isProjectStudioEditView ? 'Select active project' : 'Select draft project'}</MenuItem>
                {projects.filter(project => !project.archived && (
                  isProjectStudioEditView
                    ? ['ACTIVE', 'IN_REVIEW'].includes(project.projectStatus)
                    : project.projectStatus === 'OPEN'
                )).map(project => (
                  <MenuItem key={project.projectID} value={project.projectID}>
                    {project.projectName || `Project #${project.projectID}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {isActiveProjectEditor && (
          <Grid item xs={12} md={6}>
            <TextField
              label="Project ID"
              fullWidth
              value={projectForm.projectID ? `#${projectForm.projectID}` : ''}
              InputProps={{ readOnly: true }}
            />
          </Grid>
        )}

        <Grid item xs={12} md={isEditorView ? 6 : 12}>
          <TextField
            label="Project name"
            fullWidth
            value={projectForm.projectName}
            onChange={event => updateProjectForm({ projectName: event.target.value })}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={projectForm.description}
            onChange={event => updateProjectForm({ description: event.target.value })}
          />
        </Grid>

        <Grid item xs={12} md={showCreationStudio ? 12 : 6}>
          <TextField
            label="Budget"
            type="number"
            fullWidth
            value={projectForm.budget}
            onChange={event => updateProjectForm({ budget: event.target.value })}
          />
        </Grid>

        {!showCreationStudio && (
          <Grid item xs={12} md={6}>
            <TextField
              label={selectedProject?.projectStatus === 'ACTIVE' ? 'Actual Cost' : 'Estimated Cost'}
              fullWidth
              value={selectedProject?.projectStatus === 'ACTIVE'
                ? formatMoney(selectedProject.actualCost)
                : formatMoney(selectedProject?.estimatedCost ?? 0)}
              InputProps={{ readOnly: true }}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Teams</InputLabel>
            <Select
              multiple
              value={projectForm.teamIDs}
              label="Teams"
              onChange={event => updateProjectForm({ teamIDs: event.target.value })}
              renderValue={selected => selected
                .map(teamID => teams.find(team => team.teamID === Number(teamID))?.teamName || `Team #${teamID}`)
                .join(', ')}
            >
              {projectTeamSelectOptions.map(team => (
                <MenuItem key={team.teamID} value={team.teamID}>
                  {team.teamName || `Team #${team.teamID}`}{!(team.workers || []).length ? ' (empty)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {(!selectedProject || selectedProject.projectStatus === 'OPEN') && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Attach to active project</InputLabel>
              <Select
                value={projectForm.associatedActiveProjectID}
                label="Attach to active project"
                onChange={event => updateProjectForm({ associatedActiveProjectID: event.target.value })}
              >
                <MenuItem value="">Not attached</MenuItem>
                {activeProjectOptions
                  .filter(project => project.projectID !== Number(projectForm.projectID))
                  .map(project => (
                    <MenuItem key={project.projectID} value={project.projectID}>
                      {project.projectName || `Project #${project.projectID}`}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        {showCreationStudio ? (
          <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={saving}>
            New
          </Button>
        ) : (
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving || ((isStudioEditView || isProjectStudioEditView) && !selectedProject)}>
            Save
          </Button>
        )}

        {isStudioEditView && selectedProject?.projectStatus === 'OPEN' && (
          <Button
            variant="contained"
            startIcon={<RocketLaunchIcon />}
            disabled={saving || Boolean(selectedProject.associatedActiveProject || projectForm.associatedActiveProjectID)}
            onClick={() => onLaunchProject(selectedProject)}
          >
            Launch as new project
          </Button>
        )}

        {isStudioEditView && selectedProject?.projectStatus === 'OPEN' && (
          <Button
            variant="outlined"
            color="warning"
            disabled={saving}
            onClick={() => onArchiveDraftProject?.(selectedProject)}
          >
            Archive Draft
          </Button>
        )}

        {isStudioEditView && selectedProject?.projectStatus === 'OPEN' && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={saving}
            onClick={() => onDeleteDraftProject(selectedProject)}
          >
            Delete Permanently
          </Button>
        )}

        {isActiveProjectEditor && selectedProject?.projectStatus === 'ACTIVE' && (
          <Button
            variant="contained"
            color="success"
            disabled={saving || !projectWorkOrdersAreComplete(selectedProject) || projectHasEmptyAssociatedTeam(selectedProject)}
            onClick={() => onSubmitForReview(selectedProject)}
          >
            Submit for Review
          </Button>
        )}
      </Stack>

      {isActiveProjectEditor && selectedProject?.projectStatus === 'ACTIVE' && !projectWorkOrdersAreComplete(selectedProject) && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          All work orders must be complete before this project can be submitted for review.
        </Typography>
      )}

      {isActiveProjectEditor && selectedProject?.projectStatus === 'ACTIVE' && projectHasEmptyAssociatedTeam(selectedProject) && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Associated team is empty: {emptyProjectTeamNames(selectedProject).join(', ')}.
        </Alert>
      )}

      {isStudioEditView && selectedProject?.projectStatus === 'OPEN' && selectedProject.associatedActiveProject && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Drafts associated with an active project remain references and cannot be launched.
        </Typography>
      )}
    </Paper>
  );
};

export default ProjectEditorForm;
