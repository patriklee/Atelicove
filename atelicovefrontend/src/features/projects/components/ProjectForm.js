import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { formatMoney } from '../../../model';
import { AppIcon, AppSelect, ICON_SIZES, icons } from '../../../shared/icons';

const plannerCardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: theme => theme.customShadows.soft,
  bgcolor: 'background.paper',
};

const snapshotRowSx = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 2,
};

function SummaryLabel({ icon, children }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ color: 'brand.secondary', display: 'flex', flex: '0 0 auto' }}>
        <AppIcon icon={icon} size={ICON_SIZES.compact} />
      </Box>
      <Typography variant="body2" color="text.secondary">{children}</Typography>
    </Stack>
  );
}

const plannerSteps = [
  'Details',
  'Budget & Schedule',
  'Teams & Resources',
  'Review & Create',
];

const projectTemplates = [
  {
    value: 'blank',
    label: 'Blank Project',
    projectName: '',
    description: '',
  },
  {
    value: 'office-renovation',
    label: 'Office Renovation',
    projectName: 'Office Renovation',
    description: 'Renovate an existing office space, coordinate trades, and prepare the completed space for handover.',
  },
  {
    value: 'warehouse-expansion',
    label: 'Warehouse Expansion',
    projectName: 'Warehouse Expansion',
    description: 'Expand warehouse capacity while coordinating site preparation, installation, inspection, and handover.',
  },
  {
    value: 'manufacturing-upgrade',
    label: 'Manufacturing Upgrade',
    projectName: 'Manufacturing Upgrade',
    description: 'Upgrade manufacturing equipment and supporting infrastructure with a controlled installation and inspection plan.',
  },
  {
    value: 'preventive-maintenance',
    label: 'Preventive Maintenance',
    projectName: 'Preventive Maintenance',
    description: 'Plan and coordinate preventive maintenance work to protect equipment reliability and operational continuity.',
  },
];

const suggestedWorkOrders = [
  'Site Preparation',
  'Primary Installation',
  'Safety Inspection',
  'Final Inspection and Handover',
];

export default function ProjectForm({ form, project, teams, saving, onChange, onReset, onSubmit }) {
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const readinessItems = [
    { label: 'Name entered', complete: Boolean(form.projectName.trim()) },
    { label: 'Description entered', complete: Boolean(form.description.trim()) },
    { label: 'Budget entered', complete: form.budget !== '' && Number(form.budget) >= 0 },
    { label: 'Team assigned', complete: form.teamIDs.length > 0 },
  ];
  const completedItems = readinessItems.filter(item => item.complete).length;
  const readiness = Math.round((completedItems / readinessItems.length) * 100);
  const selectedTeams = teams.filter(team => form.teamIDs.map(Number).includes(Number(team.teamID)));
  const workOrderCount = project?.workOrders?.length;
  const readinessMessage = readiness === 100
    ? 'Ready to save and begin planning work.'
    : readiness >= 50
      ? 'A few planning details will make this project easier to launch.'
      : 'Add the core project details to shape the plan.';
  const completedSteps = [
    readinessItems[0].complete && readinessItems[1].complete,
    readinessItems[2].complete,
    readinessItems[3].complete,
    readiness === 100,
  ];

  useEffect(() => {
    setSelectedTemplate('blank');
    setSelectedSuggestions([]);
  }, [form.projectID]);

  const applyTemplate = (templateValue) => {
    const template = projectTemplates.find(option => option.value === templateValue);
    if (!template) return;
    setSelectedTemplate(templateValue);
    onChange({
      projectName: template.projectName,
      description: template.description,
      ...(templateValue === 'blank' ? { budget: '', teamIDs: [] } : {}),
    });
  };

  const toggleSuggestion = (suggestion) => {
    setSelectedSuggestions(current => (
      current.includes(suggestion)
        ? current.filter(item => item !== suggestion)
        : [...current, suggestion]
    ));
  };

  const clearPlanner = () => {
    setSelectedTemplate('blank');
    setSelectedSuggestions([]);
    onReset();
  };

  return (
    <Paper component="form" onSubmit={onSubmit} sx={{ ...plannerCardSx, overflow: 'hidden' }}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5, bgcolor: 'background.subtle', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ color: 'brand.secondary', display: 'flex' }}>
                <AppIcon icon={icons.projectStudio} />
              </Box>
              <Typography variant="h5" component="h2">Project Planner</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {form.projectID ? `Refine project #${form.projectID} and keep its plan current.` : 'Shape the project details before work begins.'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        component="ol"
        aria-label="Project planning sequence"
        sx={{
          m: 0,
          p: { xs: 2, md: 3 },
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {plannerSteps.map((step, index) => (
          <Box
            component="li"
            key={step}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 0,
              p: 1.25,
              border: '1px solid',
              borderColor: completedSteps[index] ? 'primary.light' : 'divider',
              borderRadius: 2,
              bgcolor: completedSteps[index] ? 'brand.soft' : 'background.subtle',
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 26,
                height: 26,
                flex: '0 0 auto',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                bgcolor: completedSteps[index] ? 'primary.main' : 'background.paper',
                border: '1px solid',
                borderColor: completedSteps[index] ? 'primary.main' : 'border.default',
                color: completedSteps[index] ? 'primary.contrastText' : 'text.secondary',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600}>{step}</Typography>
              <Typography variant="caption" color="text.secondary">
                {completedSteps[index] ? 'Complete' : index === 3 ? 'Final review' : 'Add details'}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.45fr) minmax(310px, 0.8fr)' },
          alignItems: 'stretch',
        }}
      >
        <Stack spacing={2.25} sx={{ p: { xs: 2, md: 3 } }}>
          {!form.projectID && (
            <Box>
              <Typography variant="subtitle1">Start From Template</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Use a local starting point, then tailor the supported project fields.
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="project-template-label">Project template</InputLabel>
                <AppSelect
                  labelId="project-template-label"
                  value={selectedTemplate}
                  label="Project template"
                  onChange={event => applyTemplate(event.target.value)}
                >
                  {projectTemplates.map(template => (
                    <MenuItem key={template.value} value={template.value}>{template.label}</MenuItem>
                  ))}
                </AppSelect>
                <FormHelperText>Templates are local form helpers and are not saved or managed.</FormHelperText>
              </FormControl>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle1">Details</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Capture the information your team needs to understand the work.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Project Name"
                value={form.projectName}
                onChange={event => onChange({ projectName: event.target.value })}
                required
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={event => onChange({ description: event.target.value })}
                multiline
                minRows={3}
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1">Budget & Schedule</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Set the available budget. Scheduling remains tied to work orders after project creation.
            </Typography>
            <TextField
              label="Budget"
              value={form.budget}
              onChange={event => onChange({ budget: event.target.value })}
              type="number"
              fullWidth
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1">Teams & Resources</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Assign the teams that will contribute to this project.
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="project-team-label">Assigned teams</InputLabel>
              <AppSelect
                labelId="project-team-label"
                multiple
                value={form.teamIDs.map(Number)}
                label="Assigned teams"
                onChange={event => onChange({ teamIDs: event.target.value.map(Number) })}
                renderValue={selected => {
                  const names = teams
                    .filter(team => selected.map(Number).includes(Number(team.teamID)))
                    .map(team => team.teamName || `Team #${team.teamID}`);
                  return names.join(', ');
                }}
              >
                {teams.map(team => (
                  <MenuItem key={team.teamID} value={team.teamID}>
                    {team.teamName || `Team #${team.teamID}`}
                  </MenuItem>
                ))}
              </AppSelect>
            </FormControl>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1">Review & Create</Typography>
            <Typography variant="body2" color="text.secondary">
              Check the planning summary, then create the project when the supported details are ready.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" spacing={1}>
            <Button variant="text" color="secondary" onClick={clearPlanner}>Clear planner</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : form.projectID ? 'Save Changes' : 'Review & Create'}
            </Button>
          </Stack>
        </Stack>

        <Box
          component="aside"
          aria-label="Planning summary"
          sx={{
            p: { xs: 2, md: 3 },
            bgcolor: 'background.subtle',
            borderLeft: { lg: '1px solid' },
            borderTop: { xs: '1px solid', lg: 0 },
            borderColor: 'divider',
          }}
        >
          <Stack spacing={2.25}>
            <Box>
              <Typography variant="h6">Planning Summary</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                A live, local view of the current plan. No save is required.
              </Typography>
            </Box>
            <Divider />
            <Box sx={snapshotRowSx}>
              <SummaryLabel icon={icons.projects}>Project</SummaryLabel>
              <Typography variant="body2" fontWeight={600} textAlign="right">
                {form.projectName.trim() || 'Untitled project'}
              </Typography>
            </Box>
            <Box sx={snapshotRowSx}>
              <SummaryLabel icon={icons.budget}>Budget</SummaryLabel>
              <Typography variant="body2" fontWeight={600}>
                {form.budget === '' ? 'Not set' : formatMoney(form.budget)}
              </Typography>
            </Box>
            <Box sx={snapshotRowSx}>
              <SummaryLabel icon={icons.workers}>Teams</SummaryLabel>
              <Typography variant="body2" fontWeight={600}>
                {selectedTeams.length}
              </Typography>
            </Box>
            <Box sx={snapshotRowSx}>
              <SummaryLabel icon={icons.workOrders}>Linked work orders</SummaryLabel>
              <Typography variant="body2" fontWeight={600}>
                {workOrderCount == null ? 'Assigned after creation' : workOrderCount}
              </Typography>
            </Box>
            {selectedTeams.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {selectedTeams.map(team => (
                  <Chip
                    key={team.teamID}
                    size="small"
                    variant="outlined"
                    label={team.teamName || `Team #${team.teamID}`}
                  />
                ))}
              </Stack>
            )}
            <Divider />
            <Box>
              <Typography variant="subtitle2">Suggested Work Orders</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Select optional planning prompts. They will not create or save work orders.
              </Typography>
              <FormGroup sx={{ mt: 1 }}>
                {suggestedWorkOrders.map(suggestion => (
                  <FormControlLabel
                    key={suggestion}
                    control={(
                      <Checkbox
                        size="small"
                        checked={selectedSuggestions.includes(suggestion)}
                        onChange={() => toggleSuggestion(suggestion)}
                      />
                    )}
                    label={suggestion}
                    sx={{
                      mx: 0,
                      '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
                    }}
                  />
                ))}
              </FormGroup>
              <Typography variant="caption" color="text.secondary">
                {selectedSuggestions.length
                  ? `${selectedSuggestions.length} selected for planning`
                  : 'No suggestions selected'}
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography variant="subtitle2">Planning readiness</Typography>
                <Typography variant="subtitle2" color="primary.dark">{readiness}%</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={readiness}
                aria-label={`Planning readiness ${readiness} percent`}
                sx={{ mt: 1, height: 7, borderRadius: 99 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {readinessMessage}
              </Typography>
            </Box>
            <Stack spacing={0.75}>
              {readinessItems.map(item => (
                <Stack key={item.label} direction="row" justifyContent="space-between" spacing={2}>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  <Typography variant="caption" color={item.complete ? 'success.dark' : 'text.disabled'}>
                    {item.complete ? 'Ready' : 'Add detail'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}
