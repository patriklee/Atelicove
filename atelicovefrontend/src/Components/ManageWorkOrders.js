import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
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
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers, normalizeWorker } from '../model';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import TableTitleRow from './TableTitleRow';

const ManageWorkOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [createWorkOrderMode, setCreateWorkOrderMode] = useState('active');
  const [draftProjectID, setDraftProjectID] = useState('');
  const [teamID, setTeamID] = useState('');
  const [workerID, setWorkerID] = useState('');
  const [companyID, setCompanyID] = useState('');
  const [comment, setComment] = useState('');
  const [modifyWorkOrderID, setModifyWorkOrderID] = useState('');
  const [modifyDraftComment, setModifyDraftComment] = useState('');
  const [editWorkOrderMode, setEditWorkOrderMode] = useState('active');
  const [workOrderTableView, setWorkOrderTableView] = useState('active');
  const [removeTeamID, setRemoveTeamID] = useState('');
  const [removeWorkerID, setRemoveWorkerID] = useState('');
  const [removeCompanyID, setRemoveCompanyID] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [pendingDeleteWorkOrder, setPendingDeleteWorkOrder] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([apiFetch('/workers'), apiFetch('/companies/all'), apiFetch('/teams'), apiFetch('/workorders'), apiFetch('/workorders/drafts'), apiFetch('/projects/drafts')])
      .then(([workerData, companyData, teamData, workOrderData, draftWorkOrderData, projectData]) => {
        setWorkers(workerData.map(normalizeWorker));
        setCompanies(companyData);
        setTeams(teamData);
        setWorkOrders(workOrderData);
        setProjects([
          ...projectData,
          {
            projectID: '__direct_drafts__',
            projectName: '',
            archived: false,
            draftWorkOrders: draftWorkOrderData,
          },
        ]);
      })
      .catch(error => setMessage({ severity: 'error', text: error.message }))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  useEffect(() => {
    const state = location.state || {};
    if (!state.modifyWorkOrderID) {
      return;
    }

    if (state.workOrderTableView === 'draft') {
      setEditWorkOrderMode('draft');
      setWorkOrderTableView('draft');
      setModifyWorkOrderID(`draft:${state.modifyProjectID}:${state.modifyWorkOrderID}`);
    } else {
      setEditWorkOrderMode('active');
      setWorkOrderTableView('active');
      setModifyWorkOrderID(`active:${state.modifyWorkOrderID}`);
    }
    setRemoveWorkerID('');
    setRemoveTeamID('');
    setRemoveCompanyID('');
  }, [location.state]);

  const activeWorkOrders = workOrders.filter(order => !order.archived);
  const draftProjects = projects.filter(project => !project.archived && project.projectID !== '__direct_drafts__');
  const selectedCreateTeam = teams.find(team => team.teamID === Number(teamID));
  const selectedCreateTeamWorkers = (selectedCreateTeam?.workers || []).map(normalizeWorker);
  const canCreateWorkOrder = createWorkOrderMode === 'active' || (draftProjectID && teamID);
  const draftWorkOrdersByKey = new Map();
  projects
    .filter(project => !project.archived)
    .forEach(project => (project.draftWorkOrders || []).forEach(order => {
      const draftWorkOrderID = order.workOrderID ?? order.draftWorkOrderID;
      const projectID = order.projectID ?? project.projectID;
      if (!draftWorkOrderID || !projectID) {
        return;
      }
      draftWorkOrdersByKey.set(`${projectID}:${draftWorkOrderID}`, {
        ...order,
        workOrderID: draftWorkOrderID,
        draftWorkOrderID,
        status: order.status || 'DRAFT',
        company: order.company || (
          order.plannedCompanyID || order.plannedCompanyName
            ? { companyID: order.plannedCompanyID, companyName: order.plannedCompanyName || `Company #${order.plannedCompanyID}` }
            : null
        ),
        isDraftWorkOrder: true,
        projectID,
        projectName: order.projectName ?? project.projectName,
      });
    }));
  const draftWorkOrders = Array.from(draftWorkOrdersByKey.values());
  const visibleWorkOrders = workOrderTableView === 'draft' ? draftWorkOrders : activeWorkOrders;
  const workOrderSelectValue = (order) => order.isDraftWorkOrder
    ? `draft:${order.projectID}:${order.workOrderID}`
    : `active:${order.workOrderID}`;
  const parseWorkOrderSelectValue = (value) => {
    const [type, projectID, workOrderID] = String(value || '').split(':');
    if (type === 'draft') {
      return { type, projectID: Number(projectID), workOrderID: Number(workOrderID) };
    }
    if (type === 'active') {
      return { type, projectID: null, workOrderID: Number(projectID) };
    }
    return { type: '', projectID: null, workOrderID: null };
  };
  const modifiableActiveWorkOrders = activeWorkOrders.filter(order => !['COMPLETE', 'IN_REVIEW'].includes(order.status));
  const modifiableWorkOrders = editWorkOrderMode === 'draft' ? draftWorkOrders : modifiableActiveWorkOrders;
  const reviewWorkOrders = activeWorkOrders.filter(order => order.status === 'IN_REVIEW');
  const selectedModifyWorkOrder = useMemo(
    () => {
      const parsed = parseWorkOrderSelectValue(modifyWorkOrderID);
      if (parsed.type === 'draft') {
        return draftWorkOrders.find(order => order.projectID === parsed.projectID && order.workOrderID === parsed.workOrderID);
      }
      if (parsed.type === 'active') {
        return workOrders.find(order => order.workOrderID === parsed.workOrderID);
      }
      return null;
    },
    [modifyWorkOrderID, draftWorkOrders, workOrders]
  );
  const selectedModifyIsDraft = Boolean(selectedModifyWorkOrder?.isDraftWorkOrder);
  const canEditSelectedWorkOrder = Boolean(selectedModifyWorkOrder);
  const selectedModifyWorkers = selectedModifyWorkOrder ? getWorkOrderWorkers(selectedModifyWorkOrder) : [];
  const selectedDraftTeam = selectedModifyIsDraft
    ? teams.find(team => team.teamID === Number(selectedModifyWorkOrder?.plannedTeamID))
    : null;
  const selectedDraftTeamWorkers = (selectedDraftTeam?.workers || []).map(normalizeWorker);
  const displayedModifyWorkers = selectedModifyIsDraft ? selectedDraftTeamWorkers : selectedModifyWorkers;
  const selectedModifyTeam = teams.find(team => team.teamID === Number(removeTeamID));
  const selectedModifyTeamWorkers = (selectedModifyTeam?.workers || []).map(normalizeWorker);
  const selectedModifyWorker = workers.find(worker => worker.workerID === Number(removeWorkerID));
  const selectedModifyCompany = companies.find(company => company.companyID === Number(removeCompanyID));
  const modifyCompanyOptions = selectedModifyIsDraft
    ? companies
    : selectedModifyWorkOrder?.company
    ? [selectedModifyWorkOrder.company]
    : companies;
  const isSelectedWorkerAssigned = Boolean(
    selectedModifyWorker && (
      selectedModifyIsDraft
        ? selectedModifyTeamWorkers.some(worker => worker.workerID === selectedModifyWorker.workerID)
        : selectedModifyWorkers.some(worker => worker.workerID === selectedModifyWorker.workerID)
    )
  );
  const isSelectedCompanyAssigned = Boolean(
    selectedModifyCompany && selectedModifyWorkOrder?.company?.companyID === selectedModifyCompany.companyID
  );
  const unassignedSelectedTeamWorkers = selectedModifyTeamWorkers.filter(teamWorker => (
    !selectedModifyWorkers.some(worker => worker.workerID === teamWorker.workerID)
  ));
  const canRemoveSelection = selectedModifyIsDraft
    ? Boolean(selectedDraftTeam)
    : (isSelectedWorkerAssigned || isSelectedCompanyAssigned);
  const canUpdateSelection = Boolean(
    canEditSelectedWorkOrder && (
      selectedModifyIsDraft
        ? Number(removeTeamID || 0) !== Number(selectedModifyWorkOrder?.plannedTeamID || 0) ||
          Boolean(selectedModifyWorker && removeTeamID && !isSelectedWorkerAssigned) ||
          selectedModifyCompany?.companyID !== selectedModifyWorkOrder?.company?.companyID ||
          modifyDraftComment !== (selectedModifyWorkOrder?.comment || '')
        : (
          (selectedModifyWorker && !isSelectedWorkerAssigned) ||
          unassignedSelectedTeamWorkers.length > 0 ||
          (selectedModifyCompany && !isSelectedCompanyAssigned)
        )
    )
  );
  const canDeleteWorkOrder = (order) => Boolean(
    order &&
    order.status === 'OPEN' &&
    !order.endDateTime &&
    !(order.items?.length)
  );

  useEffect(() => {
    if (selectedModifyIsDraft) {
      setRemoveTeamID(selectedModifyWorkOrder?.plannedTeamID || '');
      setRemoveWorkerID('');
      setRemoveCompanyID(selectedModifyWorkOrder?.company?.companyID || '');
      setModifyDraftComment(selectedModifyWorkOrder?.comment || '');
    }
  }, [
    selectedModifyIsDraft,
    selectedModifyWorkOrder?.workOrderID,
    selectedModifyWorkOrder?.projectID,
    selectedModifyWorkOrder?.plannedTeamID,
    selectedModifyWorkOrder?.company?.companyID,
    selectedModifyWorkOrder?.comment,
  ]);

  const resetAssignForm = () => {
    setDraftProjectID('');
    setTeamID('');
    setWorkerID('');
    setCompanyID('');
    setComment('');
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    const worker = workers.find(item => item.workerID === Number(workerID));
    const company = companies.find(item => item.companyID === Number(companyID));

    setSaving(true);
    setMessage(null);
    try {
      if (createWorkOrderMode === 'draft') {
        const savedProject = await apiFetch(`/projects/${draftProjectID}/draft-workorders`, {
          method: 'POST',
          body: JSON.stringify({
            teamID: Number(teamID),
            companyID: company?.companyID || null,
            comment: comment.trim(),
          }),
        });
        const savedDrafts = savedProject.draftWorkOrders || [];
        const savedDraft = savedDrafts[savedDrafts.length - 1];
        setMessage({
          severity: 'success',
          text: savedDraft?.workOrderID
            ? `Draft work order #${savedDraft.workOrderID} created.`
            : 'Draft work order created.',
        });
        resetAssignForm();
        loadData();
        return;
      }

      const workerPayload = worker ? {
        workerID: worker.workerID,
        workerFName: worker.firstName,
        workerLName: worker.lastName,
        workerUser: worker.username,
        admin: worker.isAdmin,
      } : null;
      const workerPayloadsById = new Map();
      selectedCreateTeamWorkers.forEach(teamWorker => {
        workerPayloadsById.set(teamWorker.workerID, {
          workerID: teamWorker.workerID,
          workerFName: teamWorker.firstName,
          workerLName: teamWorker.lastName,
          workerUser: teamWorker.username,
          admin: teamWorker.isAdmin,
        });
      });
      if (workerPayload) {
        workerPayloadsById.set(workerPayload.workerID, workerPayload);
      }

      const saved = await apiFetch('/workorders', {
        method: 'POST',
        body: JSON.stringify({
          workers: Array.from(workerPayloadsById.values()),
          company: company || null,
          comment: comment.trim(),
        }),
      });

      setMessage({ severity: 'success', text: `Work order #${saved.workOrderID} created.` });
      resetAssignForm();
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const archiveWorkOrder = async (workOrder) => {
    if (!workOrder) return;
    if (workOrder.status !== 'COMPLETE') return;
    if (!window.confirm(`Archive completed work order #${workOrder.workOrderID}?`)) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/workorders/${workOrder.workOrderID}`, { method: 'DELETE' });
      setMessage({ severity: 'success', text: `Work order #${workOrder.workOrderID} archived.` });
      if (Number(modifyWorkOrderID) === workOrder.workOrderID) {
        setModifyWorkOrderID('');
        setRemoveWorkerID('');
        setRemoveCompanyID('');
      }
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteWorkOrder = (workOrder) => {
    if (!canDeleteWorkOrder(workOrder)) return;

    setPendingDeleteWorkOrder(workOrder);
    setDeletePassword('');
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletePassword('');
    setPendingDeleteWorkOrder(null);
  };

  const deleteWorkOrder = async () => {
    if (!pendingDeleteWorkOrder) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: user.username, password: deletePassword }),
      });
      await apiFetch(`/workorders/${pendingDeleteWorkOrder.workOrderID}/permanent`, { method: 'DELETE' });
      setMessage({ severity: 'success', text: `Work order #${pendingDeleteWorkOrder.workOrderID} deleted.` });

      if (Number(modifyWorkOrderID) === pendingDeleteWorkOrder.workOrderID) {
        setModifyWorkOrderID('');
        setRemoveWorkerID('');
        setRemoveCompanyID('');
      }

      closeDeleteDialog();
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeSelections = async () => {
    if (!selectedModifyWorkOrder || !canRemoveSelection) return;

    setSaving(true);
    setMessage(null);
    try {
      let updated = selectedModifyWorkOrder;

      if (selectedModifyIsDraft) {
        const project = await apiFetch(`/projects/${selectedModifyWorkOrder.projectID}/draft-workorders/${selectedModifyWorkOrder.workOrderID}`, {
          method: 'PUT',
          body: JSON.stringify({
            teamID: null,
            companyID: selectedModifyWorkOrder.company?.companyID || null,
            comment: modifyDraftComment,
          }),
        });
        updated = (project.draftWorkOrders || []).find(order => order.workOrderID === selectedModifyWorkOrder.workOrderID) || selectedModifyWorkOrder;
      } else if (isSelectedWorkerAssigned) {
        updated = await apiFetch(`/workorders/${selectedModifyWorkOrder.workOrderID}/workers/${removeWorkerID}`, {
          method: 'DELETE',
        });
      }

      if (isSelectedCompanyAssigned) {
        updated = await apiFetch(`/workorders/${selectedModifyWorkOrder.workOrderID}/company`, {
          method: 'DELETE',
        });
      }

      setMessage({
        severity: 'success',
        text: selectedModifyIsDraft
          ? `Team removed from draft work order #${updated.workOrderID}.`
          : `Selected item${removeWorkerID && removeCompanyID ? 's' : ''} removed from work order #${updated.workOrderID}.`,
      });
      setRemoveWorkerID('');
      if (selectedModifyIsDraft) {
        setRemoveTeamID('');
      }
      setRemoveCompanyID('');
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateSelections = async () => {
    if (!selectedModifyWorkOrder || !canUpdateSelection) return;

    setSaving(true);
    setMessage(null);
    try {
      let updated = selectedModifyWorkOrder;

      if (selectedModifyIsDraft) {
        const project = await apiFetch(`/projects/${selectedModifyWorkOrder.projectID}/draft-workorders/${selectedModifyWorkOrder.workOrderID}`, {
          method: 'PUT',
          body: JSON.stringify({
            teamID: removeTeamID ? Number(removeTeamID) : null,
            companyID: selectedModifyCompany?.companyID || null,
            comment: modifyDraftComment,
          }),
        });
        updated = (project.draftWorkOrders || []).find(order => order.workOrderID === selectedModifyWorkOrder.workOrderID) || selectedModifyWorkOrder;

        if (selectedModifyWorker && removeTeamID && !isSelectedWorkerAssigned) {
          const teamToUpdate = teams.find(team => team.teamID === Number(removeTeamID));
          const workerIDs = Array.from(new Set([
            ...((teamToUpdate?.workers || []).map(worker => normalizeWorker(worker).workerID)),
            selectedModifyWorker.workerID,
          ]));
          await apiFetch(`/teams/${removeTeamID}`, {
            method: 'PUT',
            body: JSON.stringify({
              teamName: teamToUpdate?.teamName || '',
              workerIDs,
              projectStartedAt: teamToUpdate?.projectStartedAt || null,
            }),
          });
        }
      } else if (selectedModifyWorker && !isSelectedWorkerAssigned) {
        updated = await apiFetch(`/workorders/${selectedModifyWorkOrder.workOrderID}/assign`, {
          method: 'PUT',
          body: JSON.stringify({ workerID: selectedModifyWorker.workerID }),
        });
      }

      if (!selectedModifyIsDraft && unassignedSelectedTeamWorkers.length) {
        for (const teamWorker of unassignedSelectedTeamWorkers) {
          updated = await apiFetch(`/workorders/${selectedModifyWorkOrder.workOrderID}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ workerID: teamWorker.workerID }),
          });
        }
      }

      if (!selectedModifyIsDraft && selectedModifyCompany && !isSelectedCompanyAssigned) {
        updated = await apiFetch(`/workorders/${selectedModifyWorkOrder.workOrderID}/company`, {
          method: 'PUT',
          body: JSON.stringify({ companyID: selectedModifyCompany.companyID }),
        });
      }

      setMessage({
        severity: 'success',
        text: `Work order #${updated.workOrderID} updated.`,
      });
      if (!selectedModifyIsDraft) {
        setRemoveTeamID('');
      }
      setRemoveWorkerID('');
      setRemoveCompanyID('');
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteDraftWorkOrder = async (workOrder) => {
    if (!workOrder?.projectID || !workOrder?.workOrderID) return;
    if (!window.confirm(`Delete draft work order #${workOrder.workOrderID}?`)) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/projects/${workOrder.projectID}/draft-workorders/${workOrder.workOrderID}`, { method: 'DELETE' });
      if (modifyWorkOrderID === workOrderSelectValue(workOrder)) {
        setModifyWorkOrderID('');
        setRemoveTeamID('');
        setRemoveWorkerID('');
        setRemoveCompanyID('');
        setModifyDraftComment('');
      }
      setMessage({ severity: 'success', text: `Draft work order #${workOrder.workOrderID} deleted.` });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const reviewWorkOrder = async (workOrderID, action) => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiFetch(`/workorders/${workOrderID}/${action}`, { method: 'PUT' });
      setMessage({
        severity: 'success',
        text: `Work order #${updated.workOrderID} ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Work Orders</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Create and edit active work orders.</Typography>
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={6}>
          <Paper component="form" onSubmit={handleAssign} sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-start" sx={{ mb: 2 }}>
              <Typography variant="h5" align="left" sx={{ fontWeight: 600 }}>Create Work Order</Typography>
              <ButtonGroup size="small" variant="outlined" aria-label="Create work order mode">
                <Button
                  type="button"
                  variant={createWorkOrderMode === 'active' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setCreateWorkOrderMode('active');
                    setDraftProjectID('');
                  }}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  variant={createWorkOrderMode === 'draft' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setCreateWorkOrderMode('draft');
                    setWorkerID('');
                  }}
                >
                  Draft
                </Button>
              </ButtonGroup>
            </Stack>

            {createWorkOrderMode === 'draft' && (
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Draft Project</InputLabel>
                <Select value={draftProjectID} label="Draft Project" onChange={event => setDraftProjectID(event.target.value)}>
                  <MenuItem value="">Select draft project</MenuItem>
                  {draftProjects.map(project => (
                    <MenuItem key={project.projectID} value={project.projectID}>
                      {project.projectName || `Project #${project.projectID}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth margin="normal" required={createWorkOrderMode === 'draft'}>
              <InputLabel>Team</InputLabel>
              <Select value={teamID} label="Team" onChange={event => setTeamID(event.target.value)}>
                <MenuItem value="">No team selected</MenuItem>
                {teams.map(team => (
                  <MenuItem key={team.teamID} value={team.teamID}>
                    {team.teamName || `Team #${team.teamID}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" disabled={createWorkOrderMode === 'draft'}>
              <InputLabel>Worker or Admin</InputLabel>
              <Select value={workerID} label="Worker or Admin" onChange={event => setWorkerID(event.target.value)}>
                <MenuItem value="">No worker selected</MenuItem>
                {workers.map(worker => (
                  <MenuItem key={worker.workerID} value={worker.workerID}>
                    {worker.firstName} {worker.lastName}{worker.isAdmin ? ' (Admin)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Company</InputLabel>
              <Select value={companyID} label="Company" onChange={event => setCompanyID(event.target.value)}>
                <MenuItem value="">No company selected</MenuItem>
                {companies.map(company => (
                  <MenuItem key={company.companyID} value={company.companyID}>{company.companyName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Comments"
              value={comment}
              onChange={event => setComment(event.target.value)}
              fullWidth
              multiline
              minRows={4}
              margin="normal"
            />

            <Button type="submit" variant="contained" disabled={saving || !canCreateWorkOrder}>
              {saving ? 'Creating...' : createWorkOrderMode === 'draft' ? 'Create Draft' : 'Create'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-start" sx={{ mb: 2 }}>
              <Typography variant="h5" align="left" sx={{ fontWeight: 600 }}>Edit Work Order</Typography>
              <ButtonGroup size="small" variant="outlined" aria-label="Edit work order mode">
                <Button
                  type="button"
                  variant={editWorkOrderMode === 'active' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setEditWorkOrderMode('active');
                    setModifyWorkOrderID('');
                    setRemoveTeamID('');
                    setRemoveWorkerID('');
                    setRemoveCompanyID('');
                    setModifyDraftComment('');
                  }}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  variant={editWorkOrderMode === 'draft' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setEditWorkOrderMode('draft');
                    setModifyWorkOrderID('');
                    setRemoveTeamID('');
                    setRemoveWorkerID('');
                    setRemoveCompanyID('');
                    setModifyDraftComment('');
                  }}
                >
                  Draft
                </Button>
              </ButtonGroup>
            </Stack>

            <FormControl fullWidth margin="normal">
              <InputLabel>Work Order</InputLabel>
              <Select
                value={modifyWorkOrderID}
                label="Work Order"
                onChange={event => {
                  setModifyWorkOrderID(event.target.value);
                  setRemoveTeamID('');
                  setRemoveWorkerID('');
                  setRemoveCompanyID('');
                  setModifyDraftComment('');
                }}
              >
                <MenuItem value="">No Work Order</MenuItem>
                {modifiableWorkOrders.map(order => (
                  <MenuItem key={workOrderSelectValue(order)} value={workOrderSelectValue(order)}>
                    #{order.workOrderID} - {order.company?.companyName || 'No company'} ({order.status}){order.isDraftWorkOrder ? ` - ${order.projectName || 'Draft project'}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" disabled={!canEditSelectedWorkOrder}>
              <InputLabel>{selectedModifyIsDraft ? 'Planned Team' : 'Team'}</InputLabel>
              <Select
                value={removeTeamID}
                label={selectedModifyIsDraft ? 'Planned Team' : 'Team'}
                onChange={event => {
                  setRemoveTeamID(event.target.value);
                  setRemoveWorkerID('');
                }}
              >
                <MenuItem value="">No Team</MenuItem>
                {teams.map(team => (
                  <MenuItem key={team.teamID} value={team.teamID}>
                    {team.teamName || `Team #${team.teamID}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" disabled={!canEditSelectedWorkOrder || (selectedModifyIsDraft && !removeTeamID)}>
              <InputLabel>{selectedModifyIsDraft ? 'Worker to Add to Team' : 'Worker'}</InputLabel>
              <Select
                value={removeWorkerID}
                label={selectedModifyIsDraft ? 'Worker to Add to Team' : 'Worker'}
                onChange={event => setRemoveWorkerID(event.target.value)}
              >
                <MenuItem value="">No Worker</MenuItem>
                {workers.map(worker => (
                  <MenuItem key={worker.workerID} value={worker.workerID}>
                    {worker.firstName} {worker.lastName}{worker.isAdmin ? ' (Admin)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" disabled={!canEditSelectedWorkOrder}>
              <InputLabel>{selectedModifyIsDraft ? 'Planned Company' : 'Company'}</InputLabel>
              <Select
                value={removeCompanyID}
                label={selectedModifyIsDraft ? 'Planned Company' : 'Company'}
                onChange={event => setRemoveCompanyID(event.target.value)}
              >
                <MenuItem value="">No Company</MenuItem>
                {modifyCompanyOptions.map(company => (
                  <MenuItem key={company.companyID} value={company.companyID}>
                    {company.companyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedModifyIsDraft && (
              <TextField
                label="Draft work order note"
                fullWidth
                multiline
                minRows={2}
                margin="normal"
                value={modifyDraftComment}
                onChange={event => setModifyDraftComment(event.target.value)}
              />
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="warning"
                disabled={saving || !canEditSelectedWorkOrder || !canRemoveSelection}
                onClick={removeSelections}
              >
                {selectedModifyIsDraft ? 'Remove Team' : 'Remove'}
              </Button>
              <Button
                variant="contained"
                disabled={saving || !canUpdateSelection}
                onClick={updateSelections}
              >
                Update
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={saving || !selectedModifyWorkOrder || (!selectedModifyIsDraft && !canDeleteWorkOrder(selectedModifyWorkOrder))}
                onClick={() => selectedModifyIsDraft ? deleteDraftWorkOrder(selectedModifyWorkOrder) : requestDeleteWorkOrder(selectedModifyWorkOrder)}
              >
                Delete
              </Button>
            </Stack>

            {selectedModifyWorkOrder && (
              <Box sx={{ mt: 3 }}>
                {selectedModifyIsDraft && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Planned Team</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                      {selectedDraftTeam ? (
                        <Chip
                          label={selectedDraftTeam.teamName || `Team #${selectedDraftTeam.teamID}`}
                        />
                      ) : <Chip label="No planned team" />}
                    </Stack>
                  </>
                )}

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {selectedModifyIsDraft ? 'Team Workers' : 'Assigned Workers'}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {displayedModifyWorkers.length ? displayedModifyWorkers.map(worker => (
                    <Chip
                      key={worker.workerID}
                      label={`${worker.firstName} ${worker.lastName}${worker.isAdmin ? ' (Admin)' : ''}`}
                      onClick={() => navigate(`/admin/manage-workers/${worker.workerID}`)}
                      clickable
                    />
                  )) : <Chip label={selectedModifyIsDraft ? 'No team workers' : 'No assigned workers'} />}
                </Stack>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>{selectedModifyIsDraft ? 'Planned Company' : 'Company'}</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {selectedModifyWorkOrder.company ? (
                    <Chip
                      label={selectedModifyWorkOrder.company.companyName}
                      onClick={() => navigate(`/admin/manage-companies/${selectedModifyWorkOrder.company.companyID}`)}
                      clickable
                    />
                  ) : <Chip label="No company assigned" />}
                </Stack>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 3 }}>
              If every worker is removed from a work order, its status returns to OPEN until someone is assigned again.
            </Alert>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} sx={{ mt: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <TableContainer sx={{ height: 320, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableTitleRow title="Review Work Order" colSpan={4} />
                  <TableRow>
                    <TableCell>Work Order</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Assigned Workers</TableCell>
                    <TableCell align="right">{workOrderTableView === 'draft' ? '' : 'Actions'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviewWorkOrders.map(order => (
                    <TableRow key={order.workOrderID}>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}
                        >
                          {order.workOrderID}
                        </Button>
                      </TableCell>
                      <TableCell>{order.company?.companyName || 'No company'}</TableCell>
                      <TableCell>
                        {getWorkOrderWorkers(order).map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned'}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            disabled={saving}
                            onClick={() => reviewWorkOrder(order.workOrderID, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="warning"
                            disabled={saving}
                            onClick={() => reviewWorkOrder(order.workOrderID, 'reject')}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!reviewWorkOrders.length && (
                    <TableRow>
                      <TableCell colSpan={4}>No work orders are currently in review.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} sx={{ mt: 6 }}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TableContainer sx={{ height: 320, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-start">
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Work Orders</Typography>
                        <ButtonGroup size="small" variant="outlined" aria-label="Work order table view">
                          <Button
                            variant={workOrderTableView === 'active' ? 'contained' : 'outlined'}
                            onClick={() => setWorkOrderTableView('active')}
                          >
                            Active
                          </Button>
                          <Button
                            variant={workOrderTableView === 'draft' ? 'contained' : 'outlined'}
                            onClick={() => setWorkOrderTableView('draft')}
                          >
                            Draft
                          </Button>
                        </ButtonGroup>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Work Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleWorkOrders.map(order => (
                    <TableRow key={workOrderSelectValue(order)}>
                      <TableCell>
                        {order.isDraftWorkOrder ? (
                          order.workOrderID
                        ) : (
                          <Button
                            size="small"
                            onClick={() => navigate(`/admin/workorders/${order.workOrderID}`)}
                          >
                            {order.workOrderID}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{order.status.replaceAll('_', ' ')}</TableCell>
                      <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(order.lastModifiedAt)}</TableCell>
                      <TableCell align="right">
                        {!order.isDraftWorkOrder && order.status === 'COMPLETE' && (
                          <Button
                            size="small"
                            color="warning"
                            disabled={saving}
                            onClick={() => archiveWorkOrder(order)}
                          >
                            Archive
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!visibleWorkOrders.length && (
                    <TableRow>
                      <TableCell colSpan={5}>No {workOrderTableView} work orders found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} fullWidth maxWidth="xs">
        <DialogTitle>Delete Work Order</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This permanently deletes an empty open work order and cannot be undone.
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Enter your password to delete work order #{pendingDeleteWorkOrder?.workOrderID}.
          </Typography>
          <TextField
            label="Enter your password"
            type="password"
            value={deletePassword}
            onChange={event => setDeletePassword(event.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button color="error" variant="contained" disabled={!deletePassword || saving} onClick={deleteWorkOrder}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageWorkOrders;
