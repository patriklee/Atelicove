import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const DraftWorkOrderAttachForm = ({
  form = {},
  projects = [],
  attachableWorkOrders = [],
  teams = [],
  companies = [],
  saving = false,
  onChange,
  onSubmit,
}) => {
  const update = (field) => (event) => onChange?.({ ...form, [field]: event.target.value });

  return (
    <Box component="form" onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Create a draft work order or attach an eligible existing work order to the selected project plan.
        </Typography>

        <FormControl fullWidth size="small">
          <InputLabel>Project</InputLabel>
          <Select label="Project" value={form.projectID || ''} onChange={update('projectID')}>
            {projects.map((project) => (
              <MenuItem key={project.projectID} value={project.projectID}>
                {project.projectName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Attach Existing Work Order</InputLabel>
          <Select label="Attach Existing Work Order" value={form.existingWorkOrderID || ''} onChange={update('existingWorkOrderID')}>
            <MenuItem value="">Create new draft work order</MenuItem>
            {attachableWorkOrders.map((workOrder) => (
              <MenuItem key={workOrder.workOrderID} value={workOrder.workOrderID}>
                #{workOrder.workOrderID} — {workOrder.status} — {workOrder.comment || 'No comment'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Planned Team</InputLabel>
          <Select label="Planned Team" value={form.teamID || ''} onChange={update('teamID')}>
            <MenuItem value="">Unassigned</MenuItem>
            {teams.map((team) => (
              <MenuItem key={team.teamID} value={team.teamID}>
                {team.teamName || `Team #${team.teamID}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Company</InputLabel>
          <Select label="Company" value={form.companyID || ''} onChange={update('companyID')}>
            <MenuItem value="">No company selected</MenuItem>
            {companies.map((company) => (
              <MenuItem key={company.companyID} value={company.companyID}>
                {company.companyName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Comment / planning note"
          value={form.comment || ''}
          onChange={update('comment')}
          fullWidth
          multiline
          minRows={2}
        />

        <Stack direction="row" justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={saving || !form.projectID}>
            Save Work Order Plan
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default DraftWorkOrderAttachForm;
