import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, formatMoney, getWorkOrderActualPrice } from '../model';
import WorkOrderDocuments from './WorkOrderDocuments';
import { useAuth } from './AuthContext';

const emptyProjectForm = {
  projectID: '',
  projectName: '',
  description: '',
  budget: '',
  teamIDs: [],
};

const emptyWorkOrderForm = {
  existingWorkOrderID: '',
  teamID: '',
  companyID: '',
  comment: '',
};

const COMMENT_TYPES = ['GENERAL', 'QUESTION', 'DECISION', 'WARNING', 'UPDATE'];

const projectPayload = (form) => ({
  projectName: form.projectName.trim() || null,
  description: form.description.trim() || null,
  budget: form.budget === '' ? null : Number(form.budget),
  teamIDs: form.teamIDs.map(Number),
});

const ProjectsPage = ({ mode = 'active', title = 'Project Studio', subtitle = '' }) => {
  const { projectID: routeProjectID } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWorkerEdit = mode === 'worker-edit';
  const canManage = user?.isAdmin === true && !isWorkerEdit;

  const [projects, setProjects] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [teams, setTeams] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [workOrderForm, setWorkOrderForm] = useState(emptyWorkOrderForm);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('GENERAL');
  const [actionItemText, setActionItemText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [projectData, workOrderData, teamData, companyData] = await Promise.all([
        apiFetch('/projects/all-with-archived'),
        apiFetch('/workorders'),
        canManage ? apiFetch('/teams') : Promise.resolve([]),
        canManage ? apiFetch('/companies') : Promise.resolve([]),
      ]);
      setProjects(projectData);
      setWorkOrders(workOrderData);
      setTeams(teamData);
      setCompanies(companyData.filter(company => !company.archived));
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleProjects = useMemo(() => projects.filter(project => !project.archived), [projects]);
  const selectedProject = projects.find(project => project.projectID === Number(projectForm.projectID));
  const selectedTeamIDs = projectForm.teamIDs.map(Number);
  const attachableWorkOrders = workOrders.filter(order => (
    !order.archived &&
    ['OPEN', 'IN_PROCESS', 'ACTIVE'].includes(order.status) &&
    (!order.project || order.project.projectID === selectedProject?.projectID)
  ));

  const loadProjectIntoForm = useCallback((project) => {
    if (!project) return;
    setProjectForm({
      projectID: project.projectID,
      projectName: project.projectName || '',
      description: project.description || '',
      budget: project.budget ?? '',
      teamIDs: (project.teams || []).map(team => team.teamID),
    });
    setWorkOrderForm(emptyWorkOrderForm);
    setMessage(null);
  }, []);

  useEffect(() => {
    if (!routeProjectID || !projects.length) return;
    loadProjectIntoForm(projects.find(project => project.projectID === Number(routeProjectID)));
  }, [loadProjectIntoForm, projects, routeProjectID]);

  const replaceProject = (updated) => {
    setProjects(current => current.map(project => (
      project.projectID === updated.projectID ? updated : project
    )));
    loadProjectIntoForm(updated);
  };

  const runProjectAction = async (path, options, successText) => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiFetch(path, options);
      if (updated) replaceProject(updated);
      else await loadData();
      setMessage({ severity: 'success', text: successText });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveProject = async (event) => {
    event.preventDefault();
    if (!projectForm.projectName.trim()) {
      setMessage({ severity: 'error', text: 'Project name is required.' });
      return;
    }
    const editing = Boolean(projectForm.projectID);
    await runProjectAction(
      editing ? `/projects/${projectForm.projectID}` : '/projects',
      { method: editing ? 'PUT' : 'POST', body: JSON.stringify(projectPayload(projectForm)) },
      editing ? 'Project updated.' : 'Project created.',
    );
  };

  const attachOrCreateWorkOrder = async (event) => {
    event.preventDefault();
    if (!selectedProject) return;
    const attaching = Boolean(workOrderForm.existingWorkOrderID);
    const path = `/projects/${selectedProject.projectID}/workorders`;
    const body = attaching
      ? { workOrderID: Number(workOrderForm.existingWorkOrderID) }
      : {
          teamID: workOrderForm.teamID ? Number(workOrderForm.teamID) : null,
          companyID: workOrderForm.companyID ? Number(workOrderForm.companyID) : null,
          comment: workOrderForm.comment || null,
        };
    await runProjectAction(
      path,
      { method: attaching ? 'PUT' : 'POST', body: JSON.stringify(body) },
      attaching ? 'Work order attached.' : 'Work order created.',
    );
    setWorkOrderForm(emptyWorkOrderForm);
  };

  const removeWorkOrder = async (workOrderID) => {
    if (!selectedProject || !window.confirm(`Remove work order #${workOrderID} from this project?`)) return;
    await runProjectAction(
      `/projects/${selectedProject.projectID}/workorders/${workOrderID}`,
      { method: 'DELETE' },
      'Work order removed from project.',
    );
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!selectedProject || !commentText.trim()) return;
    await runProjectAction(
      `/projects/${selectedProject.projectID}/comments`,
      { method: 'POST', body: JSON.stringify({ commentText: commentText.trim(), commentType }) },
      'Comment added.',
    );
    setCommentText('');
  };

  const addActionItem = async (event) => {
    event.preventDefault();
    if (!selectedProject || !actionItemText.trim()) return;
    await runProjectAction(
      `/projects/${selectedProject.projectID}/action-items`,
      { method: 'POST', body: JSON.stringify({ itemText: actionItemText.trim() }) },
      'Action item added.',
    );
    setActionItemText('');
  };

  const setActionItemCompleted = (item, completed) => runProjectAction(
    `/projects/${selectedProject.projectID}/action-items/${item.actionItemID}/complete`,
    { method: 'PUT', body: JSON.stringify({ completed }) },
    completed ? 'Action item completed.' : 'Action item reopened.',
  );

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>{subtitle}</Typography>
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      {!routeProjectID && (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Teams</TableCell>
                <TableCell>Work Orders</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleProjects.map(project => (
                <TableRow key={project.projectID}>
                  <TableCell>{project.projectName || `Project #${project.projectID}`}</TableCell>
                  <TableCell><Chip size="small" label={(project.projectStatus || 'OPEN').replaceAll('_', ' ')} /></TableCell>
                  <TableCell>{formatMoney(project.budget)}</TableCell>
                  <TableCell>{(project.teams || []).length}</TableCell>
                  <TableCell>{(project.workOrders || []).length}</TableCell>
                  <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => navigate(`/admin/projects/${project.projectID}`)}>View</Button>
                      {canManage && <Button size="small" onClick={() => loadProjectIntoForm(project)}>Edit</Button>}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!visibleProjects.length && (
                <TableRow><TableCell colSpan={7}>No active projects found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {canManage && (
        <Paper component="form" onSubmit={saveProject} sx={{ p: 3, mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">{projectForm.projectID ? 'Edit Project' : 'Create Project'}</Typography>
            {projectForm.projectID && <Button onClick={() => setProjectForm(emptyProjectForm)}>Create New</Button>}
          </Stack>
          <Stack spacing={2}>
            <TextField label="Project Name" value={projectForm.projectName} onChange={event => setProjectForm(current => ({ ...current, projectName: event.target.value }))} required />
            <TextField label="Description" value={projectForm.description} onChange={event => setProjectForm(current => ({ ...current, description: event.target.value }))} multiline minRows={2} />
            <TextField label="Budget" value={projectForm.budget} onChange={event => setProjectForm(current => ({ ...current, budget: event.target.value }))} type="number" inputProps={{ min: 0, step: '0.01' }} />
            <FormControl>
              <InputLabel>Teams</InputLabel>
              <Select multiple value={selectedTeamIDs} label="Teams" onChange={event => setProjectForm(current => ({ ...current, teamIDs: event.target.value.map(Number) }))}>
                {teams.map(team => <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>)}
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" disabled={saving}>Save Project</Button>
          </Stack>
        </Paper>
      )}

      {selectedProject && (
        <Stack spacing={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Project Work Orders</Typography>
            {(selectedProject.workOrders || []).map(order => (
              <Stack key={order.workOrderID} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                <Typography>#{order.workOrderID} · {(order.status || 'OPEN').replaceAll('_', ' ')} · {formatMoney(getWorkOrderActualPrice(order))}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}>Open</Button>
                  {canManage && <Button size="small" color="error" onClick={() => removeWorkOrder(order.workOrderID)}>Remove</Button>}
                </Stack>
              </Stack>
            ))}
            {!(selectedProject.workOrders || []).length && <Typography color="text.secondary">No work orders are associated with this project.</Typography>}
            {canManage && (
              <Stack component="form" onSubmit={attachOrCreateWorkOrder} spacing={2} sx={{ mt: 3 }}>
                <FormControl><InputLabel>Existing Work Order</InputLabel><Select value={workOrderForm.existingWorkOrderID} label="Existing Work Order" onChange={event => setWorkOrderForm(current => ({ ...current, existingWorkOrderID: event.target.value }))}><MenuItem value="">Create new</MenuItem>{attachableWorkOrders.map(order => <MenuItem key={order.workOrderID} value={order.workOrderID}>#{order.workOrderID}</MenuItem>)}</Select></FormControl>
                {!workOrderForm.existingWorkOrderID && <><FormControl><InputLabel>Team</InputLabel><Select value={workOrderForm.teamID} label="Team" onChange={event => setWorkOrderForm(current => ({ ...current, teamID: event.target.value }))}><MenuItem value="">No team</MenuItem>{teams.map(team => <MenuItem key={team.teamID} value={team.teamID}>{team.teamName}</MenuItem>)}</Select></FormControl><FormControl><InputLabel>Company</InputLabel><Select value={workOrderForm.companyID} label="Company" onChange={event => setWorkOrderForm(current => ({ ...current, companyID: event.target.value }))}><MenuItem value="">No company</MenuItem>{companies.map(company => <MenuItem key={company.companyID} value={company.companyID}>{company.companyName}</MenuItem>)}</Select></FormControl><TextField label="Work order note" value={workOrderForm.comment} onChange={event => setWorkOrderForm(current => ({ ...current, comment: event.target.value }))} multiline minRows={2} /></>}
                <Button type="submit" variant="contained" disabled={saving}>{workOrderForm.existingWorkOrderID ? 'Attach Work Order' : 'Create Work Order'}</Button>
              </Stack>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Comments</Typography>
            {(selectedProject.comments || []).map(comment => <Box key={comment.projectCommentID} sx={{ mb: 1 }}><Typography variant="body2">{comment.commentText}</Typography><Typography variant="caption" color="text.secondary">{comment.commentType || 'GENERAL'} · {formatDateTime(comment.createdAt)}</Typography></Box>)}
            <Stack component="form" onSubmit={addComment} direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 2 }}><FormControl sx={{ minWidth: 150 }}><InputLabel>Type</InputLabel><Select value={commentType} label="Type" onChange={event => setCommentType(event.target.value)}>{COMMENT_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}</Select></FormControl><TextField label="Comment" value={commentText} onChange={event => setCommentText(event.target.value)} fullWidth /><Button type="submit" variant="contained" disabled={saving}>Add</Button></Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Action Items</Typography>
            {(selectedProject.actionItems || []).map(item => <Stack key={item.actionItemID} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}><Typography sx={{ textDecoration: item.completed ? 'line-through' : 'none' }}>{item.itemText}</Typography><Button size="small" onClick={() => setActionItemCompleted(item, !item.completed)}>{item.completed ? 'Reopen' : 'Complete'}</Button></Stack>)}
            <Stack component="form" onSubmit={addActionItem} direction="row" spacing={1} sx={{ mt: 2 }}><TextField label="New action item" value={actionItemText} onChange={event => setActionItemText(event.target.value)} fullWidth /><Button type="submit" variant="contained" disabled={saving}>Add</Button></Stack>
          </Paper>

          <WorkOrderDocuments basePath={`/projects/${selectedProject.projectID}/documents`} canManage={!selectedProject.archived} title="Project Documents" emptyMessage="No documents are attached to this project." />

          {canManage && (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {selectedProject.projectStatus === 'OPEN' && <Button onClick={() => runProjectAction(`/projects/${selectedProject.projectID}/submit`, { method: 'PUT' }, 'Project submitted for review.')}>Submit for Review</Button>}
              {selectedProject.projectStatus === 'IN_REVIEW' && <Button onClick={() => runProjectAction(`/projects/${selectedProject.projectID}/reject`, { method: 'PUT' }, 'Project returned to open status.')}>Reject</Button>}
              {selectedProject.projectStatus === 'IN_REVIEW' && <Button variant="contained" onClick={() => runProjectAction(`/projects/${selectedProject.projectID}/complete`, { method: 'PUT' }, 'Project completed.')}>Complete</Button>}
              {selectedProject.projectStatus === 'COMPLETE' && <Button color="warning" onClick={() => runProjectAction(`/projects/${selectedProject.projectID}`, { method: 'DELETE' }, 'Project archived.')}>Archive</Button>}
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default ProjectsPage;
