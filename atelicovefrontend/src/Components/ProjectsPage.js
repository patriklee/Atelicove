import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
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
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers, normalizeWorker } from '../model';
import { useAuth } from './AuthContext';
import WorkOrderDocuments from './WorkOrderDocuments';

const emptyProjectForm = {
  projectID: '',
  projectName: '',
  description: '',
  budget: '',
  teamIDs: [],
  associatedActiveProjectID: '',
};

const emptyTeamForm = {
  teamID: '',
  teamName: '',
  workerIDs: [],
};

const emptyWorkOrderForm = {
  projectID: '',
  teamID: '',
  companyID: '',
  comment: '',
};

const emptyActionItemForm = {
  projectID: '',
  actionItemID: '',
  itemText: '',
  assignedWorkerID: '',
  assignedTeamID: '',
};

const commentTypes = ['GENERAL', 'QUESTION', 'DECISION', 'WARNING', 'UPDATE'];

const normalizeProject = (project = {}) => ({
  ...project,
  projectID: project.projectID ?? project.projectId ?? 0,
  projectName: project.projectName ?? '',
  description: project.description ?? '',
  budget: project.budget ?? '',
  estimatedCost: project.estimatedCost ?? '',
  actualCost: project.actualCost ?? '',
  budgetDifference: project.budgetDifference ?? '',
  projectStatus: project.projectStatus ?? 'DRAFT',
  comments: Array.isArray(project.comments) ? project.comments : [],
  actionItems: Array.isArray(project.actionItems) ? project.actionItems : [],
  snapshots: Array.isArray(project.snapshots) ? project.snapshots : [],
  associatedActiveProject: project.associatedActiveProject || null,
  teams: Array.isArray(project.teams) ? project.teams : [],
  workOrders: Array.isArray(project.workOrders) ? project.workOrders : [],
});

const normalizeTeam = (team = {}) => ({
  ...team,
  teamID: team.teamID ?? team.teamId ?? 0,
  teamName: team.teamName ?? '',
  workers: Array.isArray(team.workers) ? team.workers.map(normalizeWorker) : [],
});

const moneyOrBlank = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

const workerName = (worker) =>
  `${worker.firstName || worker.workerFName || ''} ${worker.lastName || worker.workerLName || ''}`.trim() ||
  worker.displayName ||
  worker.workerDisplayName ||
  worker.username ||
  worker.workerUser ||
  'Unnamed worker';

const formatMoney = (value) =>
  value === '' || value === null || value === undefined ? 'Not set' : `$${Number(value).toLocaleString()}`;

const projectPayload = (form) => ({
  projectName: form.projectName.trim() || null,
  description: form.description.trim() || null,
  budget: moneyOrBlank(form.budget),
  teamIDs: form.teamIDs.map(Number),
  associatedActiveProjectID: form.associatedActiveProjectID ? Number(form.associatedActiveProjectID) : null,
});

const teamPayload = (form) => ({
  teamName: form.teamName.trim() || null,
  workerIDs: form.workerIDs.map(Number),
});

const actionItemPayload = (form) => ({
  itemText: form.itemText.trim(),
  assignedWorker: form.assignedWorkerID ? { workerID: Number(form.assignedWorkerID) } : null,
  assignedTeam: form.assignedTeamID ? { teamID: Number(form.assignedTeamID) } : null,
});

const ProjectsPage = ({ mode = 'studio', title = 'Draft Studio', subtitle = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectID: routeProjectID } = useParams();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const [workOrderForm, setWorkOrderForm] = useState(emptyWorkOrderForm);
  const [selectedDraftWorkOrderID, setSelectedDraftWorkOrderID] = useState('');
  const [actionItemForm, setActionItemForm] = useState(emptyActionItemForm);
  const [commentProjectID, setCommentProjectID] = useState('');
  const [commentType, setCommentType] = useState('');
  const [commentText, setCommentText] = useState('');
  const [snapshotDialog, setSnapshotDialog] = useState(null);
  const [studioView, setStudioView] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const isWorkerEdit = mode === 'worker-edit';
  const isProjectEdit = mode === 'edit' || isWorkerEdit;
  const canManageProject = user?.isAdmin === true && !isWorkerEdit;
  const isStudioDraftView = mode === 'studio' && studioView === 'draft';
  const isStudioEditView = mode === 'studio' && studioView === 'edit';
  const isEditorView = isProjectEdit || isStudioEditView;
  const showCreationStudio = isStudioDraftView;
  const showAdminEditTools = showCreationStudio || (isEditorView && canManageProject);
  const showProjectList = !isProjectEdit && mode !== 'studio';

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/projects/all-with-archived'),
      apiFetch('/teams'),
      apiFetch('/workers'),
      apiFetch('/companies'),
    ])
      .then(([projectData, teamData, workerData, companyData]) => {
        setProjects(projectData.map(normalizeProject));
        setTeams(teamData.map(normalizeTeam));
        setWorkers(workerData.map(normalizeWorker));
        setCompanies(companyData.filter(company => !company.archived));
      })
      .catch(error => setMessage({ severity: 'error', text: error.message }))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const visibleProjects = useMemo(() => {
    const activeProjects = projects.filter(project => !project.archived);
    if (isProjectEdit) {
      return activeProjects.filter(project => project.projectID === Number(routeProjectID));
    }
    if (mode === 'active') {
      return activeProjects.filter(project => ['ACTIVE', 'IN_REVIEW'].includes(project.projectStatus));
    }
    return activeProjects;
  }, [isProjectEdit, mode, projects, routeProjectID]);

  const selectedProject = projects.find(project => project.projectID === Number(projectForm.projectID));
  const selectedTeam = teams.find(team => team.teamID === Number(teamForm.teamID));
  const selectedWorkOrderProject = projects.find(project => project.projectID === Number(workOrderForm.projectID));
  const selectedActionProject = projects.find(project => project.projectID === Number(actionItemForm.projectID));
  const activeProjectOptions = projects.filter(project => !project.archived && project.projectStatus === 'ACTIVE');
  const selectedProjectDraftWorkOrders = (selectedWorkOrderProject?.workOrders || [])
    .filter(workOrder => workOrder.status === 'DRAFT');
  const selectedDraftWorkOrder = selectedProjectDraftWorkOrders
    .find(workOrder => workOrder.workOrderID === Number(selectedDraftWorkOrderID));
  const projectWorkOrdersAreComplete = (project) =>
    Boolean(project) && (project.workOrders || []).every(workOrder => workOrder.status === 'COMPLETE');
  const hasPricedItemsForStatuses = (project, statuses) =>
    Boolean(project) && (project.workOrders || [])
      .filter(workOrder => statuses.includes(workOrder.status))
      .some(workOrder => (workOrder.items || []).some(item => Number(item.price) > 0 && Number(item.quantity || 1) > 0));
  const showProjectCostBox = isEditorView && selectedProject && (
    (selectedProject.projectStatus === 'DRAFT' && hasPricedItemsForStatuses(selectedProject, ['DRAFT'])) ||
    (selectedProject.projectStatus === 'ACTIVE' && hasPricedItemsForStatuses(selectedProject, ['COMPLETE']))
  );

  const resetProjectForm = () => setProjectForm(emptyProjectForm);
  const resetTeamForm = () => setTeamForm(emptyTeamForm);
  const resetActionItemForm = () => setActionItemForm(emptyActionItemForm);

  const loadProjectIntoForm = (project) => {
    setProjectForm({
      projectID: project.projectID,
      projectName: project.projectName || '',
      description: project.description || '',
      budget: project.budget ?? '',
      teamIDs: (project.teams || []).map(team => team.teamID),
      associatedActiveProjectID: project.associatedActiveProject?.projectID || '',
    });
    setCommentProjectID(project.projectID);
    setWorkOrderForm(current => ({ ...current, projectID: project.projectID }));
    setSelectedDraftWorkOrderID('');
    setActionItemForm(current => ({ ...current, projectID: project.projectID, actionItemID: '' }));
  };

  useEffect(() => {
    if (!isProjectEdit || !projects.length) {
      return;
    }

    const projectID = Number(routeProjectID);
    if (!projectID || Number(projectForm.projectID) === projectID) {
      return;
    }

    const project = projects.find(item => item.projectID === projectID);
    if (project) {
      loadProjectIntoForm(project);
    }
  }, [isProjectEdit, projects, routeProjectID, projectForm.projectID]);

  useEffect(() => {
    if (mode !== 'studio' || !projects.length || isProjectEdit) {
      return;
    }

    const projectID = Number(searchParams.get('projectId'));
    if (!projectID || Number(projectForm.projectID) === projectID) {
      return;
    }

    const project = projects.find(item => item.projectID === projectID);
    if (project) {
      loadProjectIntoForm(project);
    }
  }, [mode, isProjectEdit, projects, searchParams, projectForm.projectID]);

  const loadActionItemIntoForm = (project, actionItem) => {
    setActionItemForm({
      projectID: project.projectID,
      actionItemID: actionItem.actionItemID,
      itemText: actionItem.itemText || '',
      assignedWorkerID: actionItem.assignedWorker?.workerID || '',
      assignedTeamID: actionItem.assignedTeam?.teamID || '',
    });
  };

  const loadTeamIntoForm = (team) => {
    setTeamForm({
      teamID: team.teamID,
      teamName: team.teamName || '',
      workerIDs: (team.workers || []).map(worker => worker.workerID),
    });
  };

  const saveProject = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = projectPayload(projectForm);
      const saved = projectForm.projectID
        ? await apiFetch(`/projects/${projectForm.projectID}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiFetch('/projects', { method: 'POST', body: JSON.stringify(payload) });
      const normalized = normalizeProject(saved);
      setMessage({ severity: 'success', text: `Project ${saved.projectName || `#${saved.projectID}`} saved.` });
      setProjects(current => [
        normalized,
        ...current.filter(project => project.projectID !== normalized.projectID),
      ]);
      if (showCreationStudio) {
        resetProjectForm();
      } else {
        loadProjectIntoForm(normalized);
      }
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveTeam = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = teamPayload(teamForm);
      const saved = teamForm.teamID
        ? await apiFetch(`/teams/${teamForm.teamID}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiFetch('/teams', { method: 'POST', body: JSON.stringify(payload) });
      setMessage({ severity: 'success', text: `Team ${saved.teamName || `#${saved.teamID}`} saved.` });
      loadTeamIntoForm(normalizeTeam(saved));
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeTeam = async () => {
    if (!selectedTeam) return;
    if (!window.confirm(`Delete ${selectedTeam.teamName || `team #${selectedTeam.teamID}`}?`)) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/teams/${selectedTeam.teamID}`, { method: 'DELETE' });
      setMessage({ severity: 'success', text: 'Team removed.' });
      resetTeamForm();
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const createAndAttachWorkOrder = async (event) => {
    event.preventDefault();
    if (!selectedWorkOrderProject) return;

    const team = teams.find(item => item.teamID === Number(workOrderForm.teamID));
    const company = companies.find(item => item.companyID === Number(workOrderForm.companyID));
    setSaving(true);
    setMessage(null);
    try {
      const isDraftProject = selectedWorkOrderProject.projectStatus === 'DRAFT';
      const updated = await apiFetch(`/projects/${selectedWorkOrderProject.projectID}/${isDraftProject ? 'draft-workorders' : 'workorders'}`, {
        method: 'POST',
        body: JSON.stringify({
          teamID: team?.teamID || null,
          companyID: company?.companyID || null,
          comment: workOrderForm.comment.trim(),
        }),
      });
      const normalized = normalizeProject(updated);

      setMessage({
        severity: 'success',
        text: `${isDraftProject ? 'Draft work order' : 'Work order'} created for ${team?.teamName || 'unassigned work'} in ${selectedWorkOrderProject.projectName || 'project'}.`,
      });
      setProjects(current => current.map(project => project.projectID === normalized.projectID ? normalized : project));
      setWorkOrderForm(current => ({ ...emptyWorkOrderForm, projectID: current.projectID }));
      setSelectedDraftWorkOrderID('');
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedDraftWorkOrder = async () => {
    if (!selectedDraftWorkOrder) return;
    if (!window.confirm(`Delete draft work order #${selectedDraftWorkOrder.workOrderID}?`)) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/workorders/${selectedDraftWorkOrder.workOrderID}/draft`, { method: 'DELETE' });
      setSelectedDraftWorkOrderID('');
      setMessage({ severity: 'success', text: 'Draft work order deleted.' });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!commentProjectID || !commentType || !commentText.trim()) return;

    const author = normalizeWorker(user);
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/projects/${commentProjectID}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          commentText: commentText.trim(),
          commentType,
          author: {
            workerID: author.workerID,
            workerFName: author.firstName,
            workerLName: author.lastName,
            workerUser: author.username,
            admin: author.isAdmin,
          },
        }),
      });
      setCommentText('');
      setCommentType('');
      setMessage({ severity: 'success', text: 'Project comment added.' });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveActionItem = async (event) => {
    event.preventDefault();
    if (!selectedActionProject || !actionItemForm.itemText.trim()) return;

    setSaving(true);
    setMessage(null);
    try {
      const payload = actionItemPayload(actionItemForm);
      const updated = actionItemForm.actionItemID
        ? await apiFetch(`/projects/${actionItemForm.projectID}/action-items/${actionItemForm.actionItemID}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await apiFetch(`/projects/${actionItemForm.projectID}/action-items`, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
      setMessage({ severity: 'success', text: `Action item saved for ${updated.projectName || 'project'}.` });
      resetActionItemForm();
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeActionItem = async (projectID = actionItemForm.projectID, actionItemID = actionItemForm.actionItemID) => {
    if (!projectID || !actionItemID) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/projects/${projectID}/action-items/${actionItemID}`, {
        method: 'DELETE',
      });
      setMessage({ severity: 'success', text: 'Action item removed.' });
      resetActionItemForm();
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const setActionItemCompleted = async (project, actionItem, completed) => {
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/projects/${project.projectID}/action-items/${actionItem.actionItemID}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ completed }),
      });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const archiveProject = async (project) => {
    if (!project || !window.confirm(`Archive ${project.projectName || `project #${project.projectID}`}?`)) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/projects/${project.projectID}`, { method: 'DELETE' });
      setMessage({ severity: 'success', text: 'Project archived.' });
      if (Number(projectForm.projectID) === project.projectID) resetProjectForm();
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const launchProject = async (project) => {
    if (!project) return;
    if (project.associatedActiveProject) {
      setMessage({ severity: 'warning', text: 'Attached draft projects stay as draft references and cannot be launched.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const activated = await apiFetch(`/projects/${project.projectID}/activate`, { method: 'PUT' });

      setMessage({
        severity: 'success',
        text: `${activated.projectName || `Project #${activated.projectID}`} launched.`,
      });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const submitProjectForReview = async (project) => {
    if (!project) return;

    setSaving(true);
    setMessage(null);
    try {
      const submitted = await apiFetch(`/projects/${project.projectID}/submit`, { method: 'PUT' });
      setMessage({ severity: 'success', text: `${submitted.projectName || 'Project'} submitted for review.` });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const approveProject = async (project) => {
    if (!project) return;

    setSaving(true);
    setMessage(null);
    try {
      const completed = await apiFetch(`/projects/${project.projectID}/complete`, { method: 'PUT' });
      setMessage({ severity: 'success', text: `${completed.projectName || 'Project'} approved.` });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const denyProject = async (project) => {
    if (!project) return;

    setSaving(true);
    setMessage(null);
    try {
      const rejected = await apiFetch(`/projects/${project.projectID}/reject`, { method: 'PUT' });
      setMessage({ severity: 'success', text: `${rejected.projectName || 'Project'} returned to active status.` });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const associatedDraftsFor = (activeProject) =>
    projects.filter(project => project.associatedActiveProject?.projectID === activeProject.projectID);

  const snapshotsForDraft = (activeProject, draftProjectID) =>
    (activeProject.snapshots || []).filter(snapshot => Number(snapshot.sourceDraftProjectID) === Number(draftProjectID));

  const parseSnapshotData = (snapshot) => {
    try {
      return snapshot?.snapshotData ? JSON.parse(snapshot.snapshotData) : null;
    } catch (error) {
      return null;
    }
  };

  const openDraftSnapshot = (activeProject, draftProjectID) => {
    const draft = projects.find(project => project.projectID === Number(draftProjectID));
    const snapshots = snapshotsForDraft(activeProject, draftProjectID);
    const snapshot = snapshots[snapshots.length - 1] || null;
    setSnapshotDialog({ activeProject, draft, snapshot, data: parseSnapshotData(snapshot) });
  };

  const selectSnapshot = (snapshotID) => {
    if (!snapshotDialog?.draft) return;

    const snapshots = snapshotsForDraft(snapshotDialog.activeProject, snapshotDialog.draft.projectID);
    const snapshot = snapshots.find(item => item.projectSnapshotID === Number(snapshotID)) || null;
    setSnapshotDialog(current => ({ ...current, snapshot, data: parseSnapshotData(snapshot) }));
  };

  const deleteSnapshot = async () => {
    if (!snapshotDialog?.snapshot) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/projects/${snapshotDialog.activeProject.projectID}/snapshots/${snapshotDialog.snapshot.projectSnapshotID}`, {
        method: 'DELETE',
      });
      setSnapshotDialog(null);
      setMessage({ severity: 'success', text: 'Draft snapshot deleted.' });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const actionItemAssigneeName = (item) => {
    if (item.assignedWorker) {
      return workerName(normalizeWorker(item.assignedWorker));
    }
    if (item.assignedTeam) {
      return item.assignedTeam.teamName || `Team #${item.assignedTeam.teamID}`;
    }
    return 'General';
  };

  const isEditingActionItem = selectedProject && Number(actionItemForm.projectID) === selectedProject.projectID;
  const actionItemsPanel = selectedProject && (
    <Paper sx={{ p: 3, mt: isWorkerEdit ? 0 : 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PlaylistAddCheckIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Action Items</Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={saving || selectedProject.archived || selectedProject.projectStatus === 'COMPLETED'}
          onClick={() => setActionItemForm({ ...emptyActionItemForm, projectID: selectedProject.projectID })}
        >
          Add Action Item
        </Button>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Done</TableCell>
              <TableCell>Action Item</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isEditingActionItem && (
              <TableRow>
                <TableCell />
                <TableCell>
                  <TextField
                    label="Action item"
                    fullWidth
                    size="small"
                    value={actionItemForm.itemText}
                    onChange={event => setActionItemForm(current => ({ ...current, itemText: event.target.value }))}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Worker</InputLabel>
                      <Select
                        value={actionItemForm.assignedWorkerID}
                        label="Worker"
                        onChange={event => setActionItemForm(current => ({ ...current, assignedWorkerID: event.target.value, assignedTeamID: event.target.value ? '' : current.assignedTeamID }))}
                      >
                        <MenuItem value="">No worker</MenuItem>
                        {workers.map(worker => (
                          <MenuItem key={worker.workerID} value={worker.workerID}>{workerName(worker)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Team</InputLabel>
                      <Select
                        value={actionItemForm.assignedTeamID}
                        label="Team"
                        onChange={event => setActionItemForm(current => ({ ...current, assignedTeamID: event.target.value, assignedWorkerID: event.target.value ? '' : current.assignedWorkerID }))}
                      >
                        <MenuItem value="">No team</MenuItem>
                        {teams.map(team => (
                          <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="contained" size="small" startIcon={<SaveIcon />} disabled={saving || !actionItemForm.itemText.trim()} onClick={saveActionItem}>
                      {actionItemForm.actionItemID ? 'Save Action Item' : 'Save'}
                    </Button>
                    <Button variant="outlined" size="small" onClick={resetActionItemForm}>
                      Cancel
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            )}
            {(selectedProject.actionItems || []).map(item => (
              <TableRow key={item.actionItemID} hover>
                <TableCell>
                  <Checkbox
                    size="small"
                    checked={Boolean(item.completed)}
                    disabled={saving || selectedProject.projectStatus === 'COMPLETED' || selectedProject.archived}
                    onChange={event => setActionItemCompleted(selectedProject, item, event.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
                    {item.itemText}
                  </Typography>
                </TableCell>
                <TableCell>{actionItemAssigneeName(item)}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} disabled={saving || selectedProject.archived || selectedProject.projectStatus === 'COMPLETED'} onClick={() => loadActionItemIntoForm(selectedProject, item)}>
                      Edit
                    </Button>
                    {canManageProject && (
                      <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={saving} onClick={() => removeActionItem(selectedProject.projectID, item.actionItemID)}>
                        Delete
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!(selectedProject.actionItems || []).length && !isEditingActionItem && (
              <TableRow>
                <TableCell colSpan={4}>No action items for this project.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{title}</Typography>
          <Typography color="text.secondary">{subtitle}</Typography>
          {mode === 'studio' && (
            <ButtonGroup variant="outlined" aria-label="Draft Studio view" sx={{ mt: 1 }}>
              <Button
                variant={studioView === 'draft' ? 'contained' : 'outlined'}
                onClick={() => setStudioView('draft')}
              >
                Draft
              </Button>
              <Button
                variant={studioView === 'edit' ? 'contained' : 'outlined'}
                onClick={() => setStudioView('edit')}
              >
                Edit
              </Button>
            </ButtonGroup>
          )}
        </Box>
      </Stack>

      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      {isProjectEdit && (
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
      )}

      {isProjectEdit && !selectedProject && (
        <Alert severity="warning" sx={{ mb: 2 }}>Project not found.</Alert>
      )}

      {showProjectCostBox && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                {selectedProject.projectStatus === 'DRAFT' ? 'Estimated Cost' : 'Actual Cost'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {selectedProject.projectStatus === 'DRAFT'
                  ? formatMoney(selectedProject.estimatedCost)
                  : formatMoney(selectedProject.actualCost)}
              </Typography>
            </Box>
            <Chip label={selectedProject.projectStatus.replaceAll('_', ' ')} />
          </Stack>
        </Paper>
      )}

      {showAdminEditTools && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={showCreationStudio ? 12 : 7}>
            <Paper component="form" onSubmit={saveProject} sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <EditIcon color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Project</Typography>
              </Stack>
              <Grid container spacing={2}>
                {isStudioEditView && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Draft Project</InputLabel>
                      <Select
                        value={projectForm.projectID}
                        label="Draft Project"
                        onChange={event => {
                          const project = projects.find(item => item.projectID === Number(event.target.value));
                          project ? loadProjectIntoForm(project) : resetProjectForm();
                        }}
                      >
                        <MenuItem value="">Select draft project</MenuItem>
                        {projects.filter(project => !project.archived && project.projectStatus === 'DRAFT').map(project => (
                          <MenuItem key={project.projectID} value={project.projectID}>
                            {project.projectName || `Project #${project.projectID}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {isProjectEdit && (
                  <Grid item xs={12} md={6}>
                    <TextField label="Project ID" fullWidth value={projectForm.projectID ? `#${projectForm.projectID}` : ''} InputProps={{ readOnly: true }} />
                  </Grid>
                )}
                <Grid item xs={12} md={isEditorView ? 6 : 12}>
                  <TextField label="Project name" fullWidth value={projectForm.projectName} onChange={event => setProjectForm(current => ({ ...current, projectName: event.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Description" fullWidth multiline minRows={3} value={projectForm.description} onChange={event => setProjectForm(current => ({ ...current, description: event.target.value }))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Budget" type="number" fullWidth value={projectForm.budget} onChange={event => setProjectForm(current => ({ ...current, budget: event.target.value }))} />
                </Grid>
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
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Teams</InputLabel>
                    <Select
                      multiple
                      value={projectForm.teamIDs}
                      label="Teams"
                      onChange={event => setProjectForm(current => ({ ...current, teamIDs: event.target.value }))}
                      renderValue={selected => selected.map(teamID => teams.find(team => team.teamID === Number(teamID))?.teamName || `Team #${teamID}`).join(', ')}
                    >
                      {teams.map(team => (
                        <MenuItem key={team.teamID} value={team.teamID}>
                          {team.teamName || `Team #${team.teamID}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {(!selectedProject || selectedProject.projectStatus === 'DRAFT') && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Attach to active project</InputLabel>
                      <Select
                        value={projectForm.associatedActiveProjectID}
                        label="Attach to active project"
                        onChange={event => setProjectForm(current => ({ ...current, associatedActiveProjectID: event.target.value }))}
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
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving || (isStudioEditView && !selectedProject)}>
                    Save
                  </Button>
                )}
                {isStudioEditView && selectedProject?.projectStatus === 'DRAFT' && !selectedProject.associatedActiveProject && (
                  <Button variant="contained" startIcon={<RocketLaunchIcon />} disabled={saving} onClick={() => launchProject(selectedProject)}>
                    Launch
                  </Button>
                )}
                {isProjectEdit && selectedProject?.projectStatus === 'ACTIVE' && (
                  <Button variant="outlined" color="warning" startIcon={<ArchiveIcon />} disabled={saving} onClick={() => archiveProject(selectedProject)}>
                    Archive
                  </Button>
                )}
                {isProjectEdit && selectedProject?.projectStatus === 'ACTIVE' && (
                  <Button
                    variant="contained"
                    color="success"
                    disabled={saving || !projectWorkOrdersAreComplete(selectedProject)}
                    onClick={() => submitProjectForReview(selectedProject)}
                  >
                    Submit for Review
                  </Button>
                )}
              </Stack>
              {isProjectEdit && selectedProject?.projectStatus === 'ACTIVE' && !projectWorkOrdersAreComplete(selectedProject) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  All work orders must be complete before this project can be submitted for review.
                </Typography>
              )}
            </Paper>
          </Grid>

          {isEditorView && selectedProject && (
          <Grid item xs={12} lg={5}>
            <Paper component="form" onSubmit={saveTeam} sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <GroupsIcon color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Team</Typography>
              </Stack>
              <FormControl fullWidth margin="normal">
                <InputLabel>Edit team</InputLabel>
                <Select
                  value={teamForm.teamID}
                  label="Edit team"
                  onChange={event => {
                    const team = teams.find(item => item.teamID === Number(event.target.value));
                    team ? loadTeamIntoForm(team) : resetTeamForm();
                  }}
                >
                  <MenuItem value="">New team</MenuItem>
                  {teams.map(team => (
                    <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Team name" fullWidth margin="normal" value={teamForm.teamName} onChange={event => setTeamForm(current => ({ ...current, teamName: event.target.value }))} />
              <FormControl fullWidth margin="normal">
                <InputLabel>Workers</InputLabel>
                <Select
                  multiple
                  value={teamForm.workerIDs}
                  label="Workers"
                  onChange={event => setTeamForm(current => ({ ...current, workerIDs: event.target.value }))}
                  renderValue={selected => selected.map(workerID => workerName(workers.find(worker => worker.workerID === Number(workerID)) || {})).join(', ')}
                >
                  {workers.map(worker => (
                    <MenuItem key={worker.workerID} value={worker.workerID}>{workerName(worker)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving || teamForm.workerIDs.length === 0}>
                  Save
                </Button>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={resetTeamForm}>
                  New
                </Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={!selectedTeam || saving} onClick={removeTeam}>
                  Delete
                </Button>
              </Stack>
            </Paper>
          </Grid>
          )}

          {isEditorView && selectedProject && (
          <Grid item xs={12} lg={7}>
            <Paper component="form" onSubmit={createAndAttachWorkOrder} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {selectedWorkOrderProject?.projectStatus === 'ACTIVE' ? 'Create Work Order For Project' : 'Create Draft Work Order For Team'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Project</InputLabel>
                    <Select
                      value={workOrderForm.projectID}
                      label="Project"
                      disabled={isEditorView}
                      onChange={event => {
                        setWorkOrderForm(current => ({ ...current, projectID: event.target.value }));
                        setSelectedDraftWorkOrderID('');
                      }}
                    >
                      <MenuItem value="">No project</MenuItem>
                      {(isEditorView && selectedProject ? [selectedProject] : projects.filter(project => !project.archived && project.projectStatus === 'DRAFT')).map(project => (
                        <MenuItem key={project.projectID} value={project.projectID}>{project.projectName || `Project #${project.projectID}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Team</InputLabel>
                    <Select value={workOrderForm.teamID} label="Team" onChange={event => setWorkOrderForm(current => ({ ...current, teamID: event.target.value }))}>
                      <MenuItem value="">{selectedWorkOrderProject?.projectStatus === 'ACTIVE' ? 'No team selected (open)' : 'No team selected'}</MenuItem>
                      {teams.map(team => (
                        <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Company</InputLabel>
                    <Select value={workOrderForm.companyID} label="Company" onChange={event => setWorkOrderForm(current => ({ ...current, companyID: event.target.value }))}>
                      <MenuItem value="">No company selected</MenuItem>
                      {companies.map(company => (
                        <MenuItem key={company.companyID} value={company.companyID}>{company.companyName || `Company #${company.companyID}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!selectedWorkOrderProject || !selectedProjectDraftWorkOrders.length}>
                    <InputLabel>Edit draft work order</InputLabel>
                    <Select
                      value={selectedDraftWorkOrderID}
                      label="Edit draft work order"
                      onChange={event => setSelectedDraftWorkOrderID(event.target.value)}
                    >
                      <MenuItem value="">Select draft</MenuItem>
                      {selectedProjectDraftWorkOrders.map(workOrder => (
                        <MenuItem key={workOrder.workOrderID} value={workOrder.workOrderID}>
                          #{workOrder.workOrderID} - {workOrder.company?.companyName || 'No company'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!selectedDraftWorkOrder}
                      onClick={() => navigate(`/admin/my-assignments/${selectedDraftWorkOrder.workOrderID}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={!selectedDraftWorkOrder || saving}
                      onClick={deleteSelectedDraftWorkOrder}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <TextField label={selectedWorkOrderProject?.projectStatus === 'DRAFT' ? 'Draft work order note' : 'Work order note'} fullWidth multiline minRows={2} value={workOrderForm.comment} onChange={event => setWorkOrderForm(current => ({ ...current, comment: event.target.value }))} />
                </Grid>
              </Grid>
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
                disabled={
                  saving ||
                  !workOrderForm.projectID ||
                  (selectedWorkOrderProject?.projectStatus === 'DRAFT' && !workOrderForm.teamID) ||
                  !['DRAFT', 'ACTIVE'].includes(selectedWorkOrderProject?.projectStatus)
                }
              >
                {selectedWorkOrderProject?.projectStatus === 'ACTIVE' ? 'Create Work Order' : 'Create Draft'}
              </Button>
              {selectedWorkOrderProject && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Associated Work Orders</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                    {(selectedWorkOrderProject.workOrders || []).map(workOrder => (
                      <Button
                        key={workOrder.workOrderID}
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(workOrder.status === 'DRAFT'
                          ? `/admin/my-assignments/${workOrder.workOrderID}`
                          : `/admin/workorders/${workOrder.workOrderID}`)}
                      >
                        #{workOrder.workOrderID} {workOrder.company?.companyName || 'No company'} ({workOrder.status.replaceAll('_', ' ')})
                      </Button>
                    ))}
                    {!(selectedWorkOrderProject.workOrders || []).length && (
                      <Typography variant="body2" color="text.secondary">No work orders for this project.</Typography>
                    )}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Grid>
          )}

          {isEditorView && selectedProject && (
          <Grid item xs={12} lg={5}>
            <Paper component="form" onSubmit={addComment} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Project Comment</Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Project</InputLabel>
                <Select value={commentProjectID} label="Project" disabled={isEditorView} onChange={event => setCommentProjectID(event.target.value)}>
                  <MenuItem value="">No project</MenuItem>
                  {(isEditorView && selectedProject ? [selectedProject] : projects.filter(project => !project.archived && project.projectStatus !== 'COMPLETED')).map(project => (
                    <MenuItem key={project.projectID} value={project.projectID}>{project.projectName || `Project #${project.projectID}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Comment type</InputLabel>
                <Select value={commentType} label="Comment type" onChange={event => setCommentType(event.target.value)}>
                  <MenuItem value="">Select type</MenuItem>
                  {commentTypes.map(type => (
                    <MenuItem key={type} value={type}>{type.replaceAll('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Comment" fullWidth multiline minRows={4} margin="normal" value={commentText} onChange={event => setCommentText(event.target.value)} />
              <Button type="submit" variant="contained" disabled={saving || !commentProjectID || !commentType || !commentText.trim()}>
                Add Comment
              </Button>
            </Paper>
          </Grid>
          )}

          {isEditorView && selectedProject && ['DRAFT', 'ACTIVE'].includes(selectedProject.projectStatus) && (
            <Grid item xs={12}>
              <WorkOrderDocuments
                basePath={`/projects/${selectedProject.projectID}/documents`}
                canManage={!selectedProject.archived}
                title="Project Documents"
                emptyMessage="No documents are attached to this project."
              />
            </Grid>
          )}
        </Grid>
      )}

      {showCreationStudio && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Draft Projects</Typography>
            <Chip label={`${projects.filter(project => !project.archived && project.projectStatus === 'DRAFT').length} drafts`} />
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Estimated</TableCell>
                  <TableCell>Teams</TableCell>
                  <TableCell>Work Orders</TableCell>
                  <TableCell>Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.filter(project => !project.archived && project.projectStatus === 'DRAFT').map(project => (
                  <TableRow key={project.projectID} hover>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => {
                          loadProjectIntoForm(project);
                          setStudioView('edit');
                        }}
                        sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                      >
                        {project.projectName || `Project #${project.projectID}`}
                      </Button>
                      <Typography variant="caption" color="text.secondary">{project.description || 'No description'}</Typography>
                    </TableCell>
                    <TableCell>{formatMoney(project.budget)}</TableCell>
                    <TableCell>{formatMoney(project.estimatedCost)}</TableCell>
                    <TableCell>{(project.teams || []).length}</TableCell>
                    <TableCell>{(project.workOrders || []).length || project.workOrderCount || 0}</TableCell>
                    <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
                  </TableRow>
                ))}
                {!projects.filter(project => !project.archived && project.projectStatus === 'DRAFT').length && (
                  <TableRow>
                    <TableCell colSpan={6}>No draft projects found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {isEditorView && actionItemsPanel}

      {showProjectList && (
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {mode === 'active' ? 'Active Projects' : isStudioEditView ? 'Edit Projects' : 'Projects'}
          </Typography>
          <Chip label={`${visibleProjects.length} shown`} />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Estimate / Actual</TableCell>
                <TableCell>Teams</TableCell>
                <TableCell>Work Orders</TableCell>
                {mode === 'active' && <TableCell>Draft Snapshot</TableCell>}
                <TableCell>Comments</TableCell>
                <TableCell>Action Items</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleProjects.map(project => (
                <TableRow key={project.projectID} hover>
                  <TableCell>
                    {mode === 'active' || isStudioEditView ? (
                      <Button
                        size="small"
                        onClick={() => navigate(`/admin/projects/${project.projectID}/edit`)}
                        sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                      >
                        {project.projectName || `Project #${project.projectID}`}
                      </Button>
                    ) : (
                      <Typography variant="subtitle2">{project.projectName || `Project #${project.projectID}`}</Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">{project.description || 'No description'}</Typography>
                  </TableCell>
                  <TableCell>{project.projectStatus.replaceAll('_', ' ')}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatMoney(project.budget)}</Typography>
                    {project.projectStatus === 'DRAFT' && (
                      <Typography variant="caption" color="text.secondary">
                        Difference: {formatMoney(project.budgetDifference)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.projectStatus === 'DRAFT' ? (
                      <Typography variant="body2">Estimated: {formatMoney(project.estimatedCost)}</Typography>
                    ) : (
                      <Typography variant="body2">Actual: {formatMoney(project.actualCost)}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                      {(project.teams || []).map(team => (
                        <Chip key={team.teamID} size="small" label={team.teamName || `Team #${team.teamID}`} />
                      ))}
                      {!(project.teams || []).length && <Typography variant="caption">None</Typography>}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {(project.workOrders || []).length || project.workOrderCount || 0}
                  </TableCell>
                  {mode === 'active' && (
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Draft</InputLabel>
                        <Select
                          value=""
                          label="Draft"
                          onChange={event => openDraftSnapshot(project, event.target.value)}
                          disabled={!associatedDraftsFor(project).length}
                        >
                          <MenuItem value="">Select draft</MenuItem>
                          {associatedDraftsFor(project).map(draft => (
                            <MenuItem key={draft.projectID} value={draft.projectID}>
                              {draft.projectName || `Draft #${draft.projectID}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  )}
                  <TableCell>{(project.comments || []).length}</TableCell>
                  <TableCell>{(project.actionItems || []).filter(item => item.completed).length}/{(project.actionItems || []).length}</TableCell>
                  <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {mode !== 'active' && project.projectStatus === 'DRAFT' && !project.associatedActiveProject && (
                        <Button size="small" variant="contained" startIcon={<RocketLaunchIcon />} disabled={saving} onClick={() => launchProject(project)}>
                          Launch
                        </Button>
                      )}
                      {mode === 'active' && project.projectStatus === 'IN_REVIEW' && (
                        <>
                          <Button size="small" variant="contained" color="success" disabled={saving} onClick={() => approveProject(project)}>
                            Approve
                          </Button>
                          <Button size="small" variant="outlined" color="error" disabled={saving} onClick={() => denyProject(project)}>
                            Deny
                          </Button>
                        </>
                      )}
                      {isStudioEditView && (
                        <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/admin/projects/${project.projectID}/edit`)}>
                          Edit
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!visibleProjects.length && (
                <TableRow>
                  <TableCell colSpan={mode === 'active' ? 11 : 10}>No projects found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      )}

      {isEditorView && selectedProject && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Project Details</Typography>
          <Grid container spacing={2}>
            {[selectedProject].map(project => (
              <Grid item xs={12} key={project.projectID}>
                <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 2, height: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{project.projectName || `Project #${project.projectID}`}</Typography>
                    <Chip size="small" label={project.projectStatus} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{project.description || 'No description'}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                    <Chip size="small" label={`Budget ${formatMoney(project.budget)}`} />
                    {project.projectStatus === 'DRAFT' ? (
                      <>
                        <Chip size="small" label={`Estimated ${formatMoney(project.estimatedCost)}`} />
                        <Chip size="small" label={`Difference ${formatMoney(project.budgetDifference)}`} />
                      </>
                    ) : (
                      <Chip size="small" label={`Actual ${formatMoney(project.actualCost)}`} />
                    )}
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">Work orders</Typography>
                  {(project.workOrders || []).map(order => (
                    <Typography key={order.workOrderID} variant="body2">
                      #{order.workOrderID} - {order.status} - {getWorkOrderWorkers(order).map(workerName).join(', ') || 'Unassigned'}
                    </Typography>
                  ))}
                  {!(project.workOrders || []).length && <Typography variant="body2">None</Typography>}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">Action items</Typography>
                  {(project.actionItems || []).map(item => (
                    <Stack key={item.actionItemID} direction="row" spacing={1} alignItems="center" sx={{ py: 0.25 }}>
                      <Chip size="small" label={item.completed ? 'Done' : 'Open'} />
                      <Typography variant="body2" sx={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
                        {item.itemText}
                      </Typography>
                    </Stack>
                  ))}
                  {!(project.actionItems || []).length && <Typography variant="body2">None</Typography>}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">Comments</Typography>
                  {(project.comments || []).slice(-3).map(comment => (
                    <Box key={comment.projectCommentID} sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                        <Chip size="small" label={(comment.commentType || 'UNKNOWN').replaceAll('_', ' ')} />
                        <Typography variant="caption" color="text.secondary">
                          {workerName(normalizeWorker(comment.author || {}))} - {formatDateTime(comment.createdAt)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2">{comment.commentText}</Typography>
                    </Box>
                  ))}
                  {!(project.comments || []).length && <Typography variant="body2">None</Typography>}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Dialog open={Boolean(snapshotDialog)} onClose={() => setSnapshotDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>{snapshotDialog?.draft?.projectName || 'Draft Snapshot'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2">Snapshot</Typography>
              {snapshotDialog?.snapshot ? (
                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                  <InputLabel>Snapshot</InputLabel>
                  <Select
                    value={snapshotDialog.snapshot.projectSnapshotID}
                    label="Snapshot"
                    onChange={event => selectSnapshot(event.target.value)}
                  >
                    {snapshotsForDraft(snapshotDialog.activeProject, snapshotDialog.draft.projectID).map(snapshot => (
                      <MenuItem key={snapshot.projectSnapshotID} value={snapshot.projectSnapshotID}>
                        {snapshot.snapshotName || 'Draft snapshot'} - {formatDateTime(snapshot.createdAt)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No snapshot has been saved for this draft yet.
                </Typography>
              )}
            </Box>
            {snapshotDialog?.snapshot && (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip size="small" label={`Budget ${formatMoney(snapshotDialog.snapshot.budget)}`} />
                <Chip size="small" label={`Estimated ${formatMoney(snapshotDialog.snapshot.estimatedCost)}`} />
                <Chip size="small" label={`Difference ${formatMoney(snapshotDialog.snapshot.budgetDifference)}`} />
              </Stack>
            )}
            <Box>
              <Typography variant="subtitle2">Draft Work Orders</Typography>
              {(snapshotDialog?.data?.draftWorkOrders || []).map(order => (
                <Box key={order.workOrderID} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1.5, mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Work order #{order.workOrderID}</Typography>
                  <Typography variant="body2" color="text.secondary">{order.comment || 'No note'}</Typography>
                  <Typography variant="caption" color="text.secondary">Items</Typography>
                  {(order.items || []).map(item => (
                    <Typography key={item.workOrderItemID || item.itemName} variant="body2">
                      {item.itemName || 'Item'} - {item.quantity || 0} x {formatMoney(item.price)}
                    </Typography>
                  ))}
                  {!(order.items || []).length && <Typography variant="body2">No draft items.</Typography>}
                </Box>
              ))}
              {!(snapshotDialog?.data?.draftWorkOrders || []).length && <Typography variant="body2">No draft work orders in this snapshot.</Typography>}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnapshotDialog(null)}>Close</Button>
          <Button color="error" disabled={!snapshotDialog?.snapshot || saving} onClick={deleteSnapshot}>
            Delete Snapshot
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsPage;
