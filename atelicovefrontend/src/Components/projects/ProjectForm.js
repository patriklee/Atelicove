import React from 'react';
import { Button, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';

export default function ProjectForm({ form, teams, saving, onChange, onReset, onSubmit }) {
  return (
    <Paper component="form" onSubmit={onSubmit} sx={{ p: 3, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Typography variant="h5">{form.projectID ? 'Edit Project' : 'Create Project'}</Typography>{form.projectID && <Button onClick={onReset}>Create New</Button>}</Stack>
      <Stack spacing={2}>
        <TextField label="Project Name" value={form.projectName} onChange={event => onChange({ projectName: event.target.value })} required />
        <TextField label="Description" value={form.description} onChange={event => onChange({ description: event.target.value })} multiline minRows={2} />
        <TextField label="Budget" value={form.budget} onChange={event => onChange({ budget: event.target.value })} type="number" inputProps={{ min: 0, step: '0.01' }} />
        <FormControl><InputLabel>Teams</InputLabel><Select multiple value={form.teamIDs.map(Number)} label="Teams" onChange={event => onChange({ teamIDs: event.target.value.map(Number) })}>{teams.map(team => <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>)}</Select></FormControl>
        <Button type="submit" variant="contained" disabled={saving}>Save Project</Button>
      </Stack>
    </Paper>
  );
}
