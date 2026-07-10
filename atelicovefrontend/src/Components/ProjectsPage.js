import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SaveIcon from '@mui/icons-material/Save';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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

const emptyWorkOrderForm = {
  projectID: '',
  teamID: '',
  companyID: '',
  existingWorkOrderID: '',
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
  documents: Array.isArray(project.documents) ? project.documents : [],
  snapshots: Array.isArray(project.snapshots) ? project.snapshots : [],
  associatedActiveProject: project.associatedActiveProject || null,
  plannedStaffing: Array.isArray(project.plannedStaffing) ? project.plannedStaffing : [],
  plannedTeams: Array.isArray(project.plannedTeams)
    ? project.plannedTeams
    : (Array.isArray(project.plannedStaffing) ? project.plannedStaffing : []),
  teams: Array.isArray(project.teams) ? project.teams : [],
  workOrders: Array.isArray(project.workOrders) ? project.workOrders : [],
  draftWorkOrders: Array.isArray(project.draftWorkOrders) ? project.draftWorkOrders : [],
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

const workerRole = (worker = {}) => worker.roleTitle || worker.role || worker.roleDescription || '';
const staffingSlotsFor = (team = {}) => (
  Array.isArray(team.staffingSlots) && team.staffingSlots.length
    ? team.staffingSlots
    : (team.workers || []).map(worker => ({ worker, workerID: worker.workerID ?? worker.workerId }))
);

const formatMoney = (value) =>
  value === '' || value === null || value === undefined ? 'Not set' : `$${Number(value).toLocaleString()}`;

const workOrderCost = (workOrder = {}) =>
  (workOrder.items || []).reduce((total, item) => (
    total + (Number(item.price) || 0) * (Number(item.quantity ?? 1) || 0)
  ), 0);

const projectDraftEstimatedCost = (project = {}) =>
  (project.draftWorkOrders || []).reduce((total, workOrder) => total + workOrderCost(workOrder), 0);

const projectWorkOrderCount = (project = {}) =>
  (project.workOrders || []).length +
  (project.draftWorkOrders || []).length ||
  project.workOrderCount ||
  project.draftWorkOrderCount ||
  0;

const projectPayload = (form) => ({
  projectName: form.projectName.trim() || null,
  description: form.description.trim() || null,
  budget: moneyOrBlank(form.budget),
  teamIDs: form.teamIDs.map(Number),
  associatedActiveProjectID: form.associatedActiveProjectID ? Number(form.associatedActiveProjectID) : null,
});

const actionItemPayload = (form) => ({
  itemText: form.itemText.trim(),
  assignedWorker: form.assignedWorkerID ? { workerID: Number(form.assignedWorkerID) } : null,
  assignedTeam: form.assignedTeamID ? { teamID: Number(form.assignedTeamID) } : null,
});

const ProjectsPage = ({ mode = 'studio', title = 'Draft Studio', subtitle = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectID: routeProjectID } = useParams();
  const [projects, setProjects] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [teams, setTeams] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [workOrderForm, setWorkOrderForm] = useState(emptyWorkOrderForm);
  const [actionItemForm, setActionItemForm] = useState(emptyActionItemForm);
  const [commentProjectID, setCommentProjectID] = useState('');
  const [commentType, setCommentType] = useState('');
  const [commentText, setCommentText] = useState('');
  const [snapshotDialog, setSnapshotDialog] = useState(null);
  const [projectActionItemsDialog, setProjectActionItemsDialog] = useState(null);
  const [projectWorkOrdersDialog, setProjectWorkOrdersDialog] = useState(null);
  const [workOrderTeamsDialog, setWorkOrderTeamsDialog] = useState(null);
  const [draftStudioProjectDetailsDialog, setDraftStudioProjectDetailsDialog] = useState(null);
  const [projectTeamsDialog, setProjectTeamsDialog] = useState(null);
  const [projectCommentsDialog, setProjectCommentsDialog] = useState(null);
  const [launchSignatureProject, setLaunchSignatureProject] = useState(null);
  const [launchSignature, setLaunchSignature] = useState('');
  const [launchDraftWorkOrderIDs, setLaunchDraftWorkOrderIDs] = useState([]);
  const [draftTeamView, setDraftTeamView] = useState('planned');
  const [draftTeamName, setDraftTeamName] = useState('');
  const [draftTeamWorkerIDs, setDraftTeamWorkerIDs] = useState([]);
  const [draftTeamSourceTeamIDs, setDraftTeamSourceTeamIDs] = useState([]);
  const [studioView, setStudioView] = useState('draft');
  const [projectStudioPreloadSuppressed, setProjectStudioPreloadSuppressed] = useState(false);
  const [draftStudioProjectTableView, setDraftStudioProjectTableView] = useState('draft');
  const studioResetKeyRef = useRef(null);
  const consumedProjectStudioPreloadKeyRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const isWorkerEdit = mode === 'worker-edit';
  const isProjectEdit = mode === 'edit' || isWorkerEdit;
  const isProjectStudio = mode === 'active';
  const isProjectStudioEditView = isProjectStudio && studioView === 'edit';
  const isActiveProjectEditor = isProjectEdit || isProjectStudioEditView;
  const canManageProject = user?.isAdmin === true && !isWorkerEdit;
  const isStudioDraftView = mode === 'studio' && studioView === 'draft';
  const isStudioEditView = mode === 'studio' && studioView === 'edit';
  const isEditorView = isProjectEdit || isStudioEditView || isProjectStudioEditView;
  const showCreationStudio = isStudioDraftView;
  const showAdminEditTools = showCreationStudio || (isEditorView && canManageProject);
  const showProjectList = !isProjectEdit && mode !== 'studio' && !isProjectStudioEditView;
  const draftStudioLabel = mode === 'studio' ? 'Draft Project' : 'Project';
  const projectStudioEditProjectID = location.state?.projectStudioEditProjectID;
  const skipProjectStudioEditPreload = location.state?.skipProjectStudioEditPreload;

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiFetch('/projects/all-with-archived'),
      apiFetch('/workorders'),
      apiFetch('/teams'),
      apiFetch('/workers'),
      apiFetch('/companies'),
    ])
      .then(([projectData, workOrderData, teamData, workerData, companyData]) => {
        setProjects(projectData.map(normalizeProject));
        setWorkOrders(workOrderData);
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
  const selectedWorkOrderProject = projects.find(project => project.projectID === Number(workOrderForm.projectID));
  const selectedActionProject = projects.find(project => project.projectID === Number(actionItemForm.projectID));
  const assignableTeams = teams.filter(team => (team.workers || []).length);
  const selectedProjectTeamIDs = projectForm.teamIDs.map(Number);
  const projectTeamSelectOptions = teams.filter(team => (
    (team.workers || []).length || selectedProjectTeamIDs.includes(team.teamID)
  ));
  const activeProjectOptions = projects.filter(project => !project.archived && project.projectStatus === 'ACTIVE');
  const draftStudioProjectTableProjects = projects.filter(project => (
    !project.archived &&
    (draftStudioProjectTableView === 'active'
      ? project.projectStatus === 'ACTIVE'
      : project.projectStatus === 'DRAFT')
  ));
  const attachableWorkOrders = workOrders.filter(workOrder =>
    !workOrder.archived &&
    ['OPEN', 'IN_PROCESS'].includes(workOrder.status) &&
    (selectedWorkOrderProject?.projectStatus === 'DRAFT' || !workOrder.project || workOrder.project.projectID === Number(workOrderForm.projectID))
  );
  const projectWorkOrdersAreComplete = (project) =>
    Boolean(project) && (project.workOrders || []).every(workOrder => workOrder.status === 'COMPLETE');
  const projectHasEmptyAssociatedTeam = (project) =>
    Boolean(project) && project.projectStatus !== 'DRAFT' && (project.teams || []).some(team => !(team.workers || []).length);
  const emptyProjectTeamNames = (project) =>
    (project?.teams || [])
      .filter(team => !(team.workers || []).length)
      .map(team => team.teamName || `Team #${team.teamID}`);
  const reviewProjects = projects.filter(project => !project.archived && project.projectStatus === 'IN_REVIEW');
  const archiveProjects = projects.filter(project => !project.archived && project.projectStatus !== 'DRAFT');
  const projectReadyToArchive = (project) =>
    Boolean(project) && project.projectStatus === 'COMPLETED' && projectWorkOrdersAreComplete(project);
  const associatedWorkOrdersFor = (project = {}) => [
    ...(project.workOrders || []),
    ...(project.draftWorkOrders || []),
  ].filter(workOrder => !workOrder.archived);
  const plannedTeamsForProject = (project = {}) => (
    project.projectStatus === 'DRAFT' ? (project.plannedTeams || []) : (project.teams || [])
  );
  const plannedTeamCount = (project = {}) => plannedTeamsForProject(project).length;
  const teamsForWorkOrder = (project = {}, workOrder = {}) => {
    if (workOrder.status === 'DRAFT') {
      const plannedTeam = plannedTeamsForProject(project).find(team => Number(team.teamID) === Number(workOrder.plannedTeamID));
      if (plannedTeam) {
        return [plannedTeam];
      }
      if (workOrder.plannedTeamID || workOrder.plannedTeamName) {
        return [{
          teamID: workOrder.plannedTeamID || `draft-${workOrder.workOrderID}`,
          teamName: workOrder.plannedTeamName || `Team #${workOrder.plannedTeamID}`,
          workers: [],
        }];
      }
      return [];
    }

    const workerIDs = new Set(getWorkOrderWorkers(workOrder).map(worker => worker.workerID));
    return (project.teams || []).filter(team => (
      (team.workers || []).some(worker => workerIDs.has(normalizeWorker(worker).workerID))
    ));
  };
  const teamForWorkOrder = (project = {}, workOrder = {}) => teamsForWorkOrder(project, workOrder)[0] || null;
  const workersOutsideWorkOrderTeam = (project = {}, workOrder = {}) => {
    const teamWorkerIDs = new Set((teamForWorkOrder(project, workOrder)?.workers || []).map(worker => normalizeWorker(worker).workerID));
    return getWorkOrderWorkers(workOrder).filter(worker => !teamWorkerIDs.has(worker.workerID));
  };
  const workOrderTeamName = (project = {}, workOrder = {}) => {
    const team = teamForWorkOrder(project, workOrder);
    return team ? team.teamName || `Team #${team.teamID}` : 'No team';
  };
  const hasPricedItemsForStatuses = (project, statuses) =>
    Boolean(project) && [
      ...(project.workOrders || []),
      ...(project.draftWorkOrders || []),
    ]
      .filter(workOrder => statuses.includes(workOrder.status))
      .some(workOrder => (workOrder.items || []).some(item => Number(item.price) > 0 && Number(item.quantity || 1) > 0));
  const showProjectCostBox = isEditorView && selectedProject && !isStudioEditView && (
    (selectedProject.projectStatus === 'DRAFT' && hasPricedItemsForStatuses(selectedProject, ['DRAFT'])) ||
    (selectedProject.projectStatus === 'ACTIVE' && hasPricedItemsForStatuses(selectedProject, ['COMPLETE']))
  );

  const resetProjectForm = () => setProjectForm(emptyProjectForm);
  const resetActionItemForm = () => setActionItemForm(emptyActionItemForm);
  const clearLoadedProject = () => {
    resetProjectForm();
    setWorkOrderForm(emptyWorkOrderForm);
    resetActionItemForm();
    setCommentProjectID('');
    setCommentType('');
    setCommentText('');
  };

  const requestProjectEditLeave = (action) => {
    if (action) {
      action();
    }
  };

  useEffect(() => {
    if (!['studio', 'active'].includes(mode)) {
      studioResetKeyRef.current = null;
      return;
    }

    const nextResetKey = `${mode}:${location.state?.studioResetKey || ''}`;
    if (studioResetKeyRef.current === null) {
      studioResetKeyRef.current = nextResetKey;
      return;
    }
    if (studioResetKeyRef.current === nextResetKey) {
      return;
    }
    studioResetKeyRef.current = nextResetKey;

    setProjectStudioPreloadSuppressed(false);
    setStudioView('draft');
    clearLoadedProject();
  }, [mode, location.state?.studioResetKey]);

  const loadProjectIntoForm = (project) => {
    setProjectForm({
      projectID: project.projectID,
      projectName: project.projectName || '',
      description: project.description || '',
      budget: project.budget ?? '',
      teamIDs: plannedTeamsForProject(project).map(team => team.teamID),
      associatedActiveProjectID: project.associatedActiveProject?.projectID || '',
    });
    setCommentProjectID(project.projectID);
    setWorkOrderForm(current => ({ ...current, projectID: project.projectID }));
    setActionItemForm(current => ({ ...current, projectID: project.projectID, actionItemID: '' }));
  };

  const plannedStaffingPayload = (plannedStaffing = []) => plannedStaffing.map(staffing => ({
    id: Number(staffing.teamID) > 0 ? Number(staffing.teamID) : null,
    staffingName: staffing.staffingName || staffing.teamName || 'Planned Staffing',
    sourceTeamID: staffing.sourceTeamID || (Number(staffing.teamID) > 0 && teams.some(team => Number(team.teamID) === Number(staffing.teamID)) ? Number(staffing.teamID) : null),
    staffingSlots: (staffing.staffingSlots || staffing.slots || staffing.workers || []).map(item => {
      const worker = item.worker || item;
      const workerID = worker.workerID ?? worker.workerId ?? item.workerID ?? null;
      return {
        id: item.id || null,
        workerID: workerID ? Number(workerID) : null,
        roleName: item.roleName || worker.roleTitle || worker.role || '',
        roleDescription: item.roleDescription || worker.roleDescription || '',
      };
    }),
  }));

  const savePlannedTeamSnapshots = async (plannedTeams) => {
    if (!selectedProject) return;

    setSaving(true);
    setMessage(null);
    try {
      const teamIDs = plannedTeams.map(team => Number(team.teamID));
      const updated = await apiFetch(`/projects/${selectedProject.projectID}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...projectPayload(projectForm),
          teamIDs,
          plannedStaffing: plannedStaffingPayload(plannedTeams),
        }),
      });
      const normalized = normalizeProject(updated);
      setProjects(current => current.map(project => project.projectID === normalized.projectID ? normalized : project));
      loadProjectIntoForm(normalized);
      setMessage({ severity: 'success', text: 'Planned teams updated.' });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleDraftTeamWorker = (workerID) => {
    const numericID = Number(workerID);
    setDraftTeamWorkerIDs(current => current.includes(numericID)
      ? current.filter(id => id !== numericID)
      : [...current, numericID]);
  };

  const saveDraftOnlyTeam = async () => {
    const workersByID = new Map();
    draftTeamSourceTeamIDs
      .map(id => teams.find(team => Number(team.teamID) === Number(id)))
      .filter(Boolean)
      .forEach(team => (team.workers || []).forEach(worker => {
        const normalized = normalizeWorker(worker);
        workersByID.set(normalized.workerID, normalized);
      }));
    draftTeamWorkerIDs
      .map(id => workers.find(worker => Number(worker.workerID) === Number(id)))
      .filter(Boolean)
      .map(normalizeWorker)
      .forEach(worker => workersByID.set(worker.workerID, worker));

    const plannedTeam = {
      teamID: -Date.now(),
      teamName: draftTeamName.trim() || 'Planned Staffing',
      staffingSlots: Array.from(workersByID.values()).map(worker => ({
        workerID: worker.workerID,
        worker,
        roleName: worker.roleTitle || worker.role || '',
        roleDescription: worker.roleDescription || '',
      })),
      workers: Array.from(workersByID.values()),
    };
    await savePlannedTeamSnapshots([...plannedTeamsForProject(selectedProject), plannedTeam]);
    setDraftTeamName('');
    setDraftTeamWorkerIDs([]);
    setDraftTeamSourceTeamIDs([]);
    setDraftTeamView('planned');
  };

  const removePlannedTeam = async (teamID) => {
    if (isStudioEditView && selectedProject?.projectStatus === 'DRAFT') {
      await savePlannedTeamSnapshots(
        plannedTeamsForProject(selectedProject).filter(team => Number(team.teamID) !== Number(teamID))
      );
      return;
    }
    await removeProjectTeam(teamID);
  };

  const availableDraftWorkers = workers.filter(worker => !worker.archived);
  const draftSourceTeams = assignableTeams.filter(team => !plannedTeamsForProject(selectedProject || {})
    .some(planned => Number(planned.sourceTeamID || planned.teamID) === Number(team.teamID)));

  const buildProjectPayload = (form, teamIDs = form.teamIDs) => ({
    ...projectPayload(form),
  });

  const rememberProjectStudioSelection = (project) => {
    if (!project || !isProjectStudioEditView) {
      return;
    }

    navigate('/admin/projects/active', {
      replace: true,
      state: { projectStudioEditProjectID: project.projectID },
    });
  };

  const openProjectFromList = (project) => {
    if (!project) return;

    if (
      mode === 'active' &&
      canManageProject &&
      project.projectStatus === 'ACTIVE' &&
      !project.archived
    ) {
      setProjectStudioPreloadSuppressed(false);
      loadProjectIntoForm(project);
      setStudioView('edit');
      return;
    }

    requestProjectEditLeave(() => navigate(`/admin/projects/${project.projectID}`));
  };

  const openDraftStudioProjectForEdit = (project) => {
    if (!project) return;

    if (project.projectStatus === 'DRAFT') {
      loadProjectIntoForm(project);
      setStudioView('edit');
      return;
    }

    if (project.projectStatus === 'ACTIVE') {
      requestProjectEditLeave(() => navigate('/admin/projects/active', {
        state: { projectStudioEditProjectID: project.projectID },
      }));
      return;
    }

    requestProjectEditLeave(() => navigate(`/admin/projects/${project.projectID}`));
  };

  const editAssociatedWorkOrder = (project, workOrder) => {
    if (!workOrder?.workOrderID) {
      return;
    }

    if (workOrder.status === 'DRAFT') {
      requestProjectEditLeave(() => navigate(`/admin/draft-workorders/${project.projectID}/${workOrder.workOrderID}`));
      return;
    }

    requestProjectEditLeave(() => {
      rememberProjectStudioSelection(project);
      navigate(`/admin/my-assignments/${workOrder.workOrderID}`);
    });
  };

  useEffect(() => {
    if (
      mode !== 'active' ||
      !projects.length ||
      projectStudioPreloadSuppressed ||
      skipProjectStudioEditPreload ||
      !projectStudioEditProjectID
    ) {
      return;
    }

    const preloadKey = `${location.key || 'initial'}:${projectStudioEditProjectID}`;
    if (consumedProjectStudioPreloadKeyRef.current === preloadKey) {
      return;
    }

    const projectID = Number(projectStudioEditProjectID);
    if (!projectID) {
      consumedProjectStudioPreloadKeyRef.current = preloadKey;
      return;
    }

    const project = projects.find(item => item.projectID === projectID && ['ACTIVE', 'IN_REVIEW'].includes(item.projectStatus) && !item.archived);
    if (project) {
      consumedProjectStudioPreloadKeyRef.current = preloadKey;
      loadProjectIntoForm(project);
      setStudioView('edit');
    }
  }, [location.key, mode, projects, projectStudioEditProjectID, projectStudioPreloadSuppressed, skipProjectStudioEditPreload]);

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

  const loadActionItemIntoForm = (project, actionItem) => {
    setActionItemForm({
      projectID: project.projectID,
      actionItemID: actionItem.actionItemID,
      itemText: actionItem.itemText || '',
      assignedWorkerID: actionItem.assignedWorker?.workerID || '',
      assignedTeamID: actionItem.assignedTeam?.teamID || '',
    });
  };

  const saveProjectChanges = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = buildProjectPayload(projectForm);
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
      return true;
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveProject = async (event) => {
    event.preventDefault();
    await saveProjectChanges();
  };

  const saveProjectTeamIDs = async (teamIDs) => {
    if (!selectedProject) return;

    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiFetch(`/projects/${selectedProject.projectID}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...buildProjectPayload(projectForm, teamIDs),
          teamIDs: teamIDs.map(Number),
        }),
      });
      const normalized = normalizeProject(updated);
      setProjects(current => current.map(project => project.projectID === normalized.projectID ? normalized : project));
      loadProjectIntoForm(normalized);
      setMessage({ severity: 'success', text: selectedProject.projectStatus === 'DRAFT' ? 'Planned teams updated.' : 'Project teams updated.' });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const addProjectTeam = async (teamID) => {
    if (!teamID || !selectedProject) return;
    const team = assignableTeams.find(item => item.teamID === Number(teamID));
    if (!team) {
      setMessage({ severity: 'warning', text: 'Associated team is empty.' });
      return;
    }
    if (isStudioEditView && selectedProject.projectStatus === 'DRAFT') {
      await savePlannedTeamSnapshots([
        ...plannedTeamsForProject(selectedProject),
        {
          teamID: -Date.now(),
          teamName: team.teamName || `Team #${team.teamID}`,
          sourceTeamID: team.teamID,
          workers: team.workers || [],
          staffingSlots: (team.workers || []).map(worker => ({
            workerID: worker.workerID ?? worker.workerId,
            worker,
            roleName: worker.roleTitle || worker.role || '',
            roleDescription: worker.roleDescription || '',
          })),
        },
      ]);
      return;
    }
    const nextTeamIDs = Array.from(new Set([...selectedProjectTeamIDs, Number(teamID)]));
    await saveProjectTeamIDs(nextTeamIDs);
  };

  const removeProjectTeam = async (teamID) => {
    if (!selectedProject) return;
    const nextTeamIDs = selectedProjectTeamIDs.filter(id => id !== Number(teamID));
    await saveProjectTeamIDs(nextTeamIDs);
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
      const attachesExisting = Boolean(workOrderForm.existingWorkOrderID);
      const updated = await apiFetch(`/projects/${selectedWorkOrderProject.projectID}/${isDraftProject ? 'draft-workorders' : 'workorders'}`, {
        method: isDraftProject || !attachesExisting ? 'POST' : 'PUT',
        body: JSON.stringify({
          workOrderID: attachesExisting ? Number(workOrderForm.existingWorkOrderID) : null,
          teamID: team?.teamID || null,
          companyID: company?.companyID || null,
          comment: workOrderForm.comment.trim(),
        }),
      });
      const normalized = normalizeProject(updated);

      setMessage({
        severity: 'success',
        text: attachesExisting
          ? `${isDraftProject ? 'Draft planning copy' : 'Work order'} attached to ${selectedWorkOrderProject.projectName || 'project'}.`
          : `${isDraftProject ? 'Draft work order' : 'Work order'} created for ${team?.teamName || 'unassigned work'} in ${selectedWorkOrderProject.projectName || 'project'}.`,
      });
      setProjects(current => current.map(project => project.projectID === normalized.projectID ? normalized : project));
      setWorkOrderForm(current => ({ ...emptyWorkOrderForm, projectID: current.projectID }));
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeAssociatedWorkOrder = async (project, workOrder) => {
    if (!project || !workOrder) return;
    const isDraftWorkOrder = workOrder.status === 'DRAFT';
    const label = isDraftWorkOrder ? `draft work order #${workOrder.workOrderID}` : `work order #${workOrder.workOrderID}`;
    if (!window.confirm(`${isDraftWorkOrder ? 'Archive' : 'Remove'} ${label} ${isDraftWorkOrder ? '' : `from ${project.projectName || 'this project'}`}?`)) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(isDraftWorkOrder
        ? `/workorders/drafts/${workOrder.workOrderID}`
        : `/projects/${project.projectID}/workorders/${workOrder.workOrderID}`, {
        method: 'DELETE',
      });
      setMessage({ severity: 'success', text: `${isDraftWorkOrder ? 'Draft work order archived' : 'Work order removed from project'}.` });
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    const projectID = isEditorView && selectedProject ? selectedProject.projectID : commentProjectID;
    if (!projectID || !commentType || !commentText.trim()) return;

    const author = normalizeWorker(user);
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/projects/${projectID}/comments`, {
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
    if (!project) return;
    if (projectHasEmptyAssociatedTeam(project)) {
      setMessage({ severity: 'warning', text: 'Associated team is empty.' });
      return;
    }
    if (!window.confirm(`Archive ${project.projectName || `project #${project.projectID}`}?`)) return;

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

  const requestLaunchProject = (project) => {
    if (!project) return;
    if (project.associatedActiveProject || (project.projectID === Number(projectForm.projectID) && projectForm.associatedActiveProjectID)) {
      setMessage({ severity: 'warning', text: 'Attached draft projects stay as draft references and cannot be launched.' });
      return;
    }

    setLaunchSignatureProject(project);
    setLaunchSignature('');
    setLaunchDraftWorkOrderIDs([]);
  };

  const launchProject = async () => {
    const project = launchSignatureProject;
    if (!project || !launchSignature.trim()) return;

    setSaving(true);
    setMessage(null);
    try {
      const activated = await apiFetch(`/projects/${project.projectID}/activate`, {
        method: 'PUT',
        body: JSON.stringify({ activateDraftWorkOrderIDs: launchDraftWorkOrderIDs.map(Number) }),
      });

      setMessage({
        severity: 'success',
        text: `${activated.projectName || `Project #${activated.projectID}`} launched with signature.`,
      });
      setLaunchSignatureProject(null);
      setLaunchSignature('');
      setLaunchDraftWorkOrderIDs([]);
      resetProjectForm();
      setStudioView('draft');
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteDraftProject = async (project) => {
    if (!project || project.projectStatus !== 'DRAFT') return;
    if (!window.confirm(`Delete the entire draft ${project.projectName || `project #${project.projectID}`}? This cannot be undone.`)) return;

    setSaving(true);
    setMessage(null);
    try {
      await apiFetch(`/projects/${project.projectID}/permanent`, { method: 'DELETE' });
      setMessage({ severity: 'success', text: 'Draft project deleted.' });
      resetProjectForm();
      resetActionItemForm();
      setCommentProjectID('');
      setWorkOrderForm(emptyWorkOrderForm);
      setStudioView('draft');
      loadData();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const submitProjectForReview = async (project) => {
    if (!project) return;
    if (projectHasEmptyAssociatedTeam(project)) {
      setMessage({ severity: 'warning', text: 'Associated team is empty.' });
      return;
    }

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
    if (projectHasEmptyAssociatedTeam(project)) {
      setMessage({ severity: 'warning', text: 'Associated team is empty.' });
      return;
    }

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

  const openDraftSnapshot = (activeProject, draftProjectID) => {
    const draft = projects.find(project => project.projectID === Number(draftProjectID));
    const snapshots = snapshotsForDraft(activeProject, draftProjectID);
    const snapshot = snapshots[snapshots.length - 1] || null;
    setSnapshotDialog({ activeProject, draft, snapshot, data: null });
  };

  const selectSnapshot = (snapshotID) => {
    if (!snapshotDialog?.draft) return;

    const snapshots = snapshotsForDraft(snapshotDialog.activeProject, snapshotDialog.draft.projectID);
    const snapshot = snapshots.find(item => item.projectSnapshotID === Number(snapshotID)) || null;
    setSnapshotDialog(current => ({ ...current, snapshot, data: null }));
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

  const projectDetailsPanel = selectedProject && (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {isStudioEditView ? 'Draft Project Details' : 'Project Details'}
      </Typography>
      <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 2, maxHeight: 420, overflowY: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {selectedProject.projectName || `Project #${selectedProject.projectID}`}
          </Typography>
          <Chip size="small" label={selectedProject.projectStatus} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {selectedProject.description || 'No description'}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
          <Chip size="small" label={`Budget ${formatMoney(selectedProject.budget)}`} />
          {selectedProject.projectStatus === 'DRAFT' ? (
            <>
              <Chip size="small" label={`Estimated ${formatMoney(selectedProject.estimatedCost)}`} />
              <Chip size="small" label={`Difference ${formatMoney(selectedProject.budgetDifference)}`} />
            </>
          ) : (
            <Chip size="small" label={`Actual ${formatMoney(selectedProject.actualCost)}`} />
          )}
        </Stack>

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">Teams</Typography>
        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
          {plannedTeamsForProject(selectedProject).map(team => (
            <Chip key={team.teamID} size="small" label={team.teamName || `Team #${team.teamID}`} />
          ))}
          {!plannedTeamsForProject(selectedProject).length && <Typography variant="body2">None</Typography>}
        </Stack>

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">Documents</Typography>
        {(selectedProject.documents || []).map((document, index) => (
          <Typography key={document.documentID || document.fileNo || document.fileName || index} variant="body2">
            {document.originalFileName || document.fileName || `Document #${document.documentID || document.fileNo}`}
          </Typography>
        ))}
        {!(selectedProject.documents || []).length && <Typography variant="body2">None</Typography>}

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">Work orders</Typography>
        {[...(selectedProject.workOrders || []), ...(selectedProject.draftWorkOrders || [])].map(order => (
          <Typography key={order.workOrderID} variant="body2">
            #{order.workOrderID} - {order.status.replaceAll('_', ' ')} - {getWorkOrderWorkers(order).map(workerName).join(', ') || 'Unassigned'} - Cost {formatMoney(workOrderCost(order))}
          </Typography>
        ))}
        {!(selectedProject.workOrders || []).length && !(selectedProject.draftWorkOrders || []).length && <Typography variant="body2">None</Typography>}

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">Action items</Typography>
        {(selectedProject.actionItems || []).map(item => (
          <Stack key={item.actionItemID} direction="row" spacing={1} alignItems="center" sx={{ py: 0.25 }}>
            <Chip size="small" label={item.completed ? 'Done' : 'Open'} />
            <Typography variant="body2" sx={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
              {item.itemText}
            </Typography>
          </Stack>
        ))}
        {!(selectedProject.actionItems || []).length && <Typography variant="body2">None</Typography>}

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">Comments</Typography>
        {(selectedProject.comments || []).slice(-3).map(comment => (
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
        {!(selectedProject.comments || []).length && <Typography variant="body2">None</Typography>}
      </Box>
    </Paper>
  );

  const isEditingActionItem = selectedProject && Number(actionItemForm.projectID) === selectedProject.projectID;
  const actionItemsPanel = selectedProject && (
    <Paper sx={{ p: 3, mt: isWorkerEdit ? 0 : 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PlaylistAddCheckIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {isStudioEditView ? 'Draft Action Items' : 'Action Items'}
          </Typography>
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
          {(mode === 'studio' || mode === 'active') && (
            <ButtonGroup variant="outlined" aria-label={`${title} view`} sx={{ mt: 1 }}>
              <Button
                variant={studioView === 'draft' ? 'contained' : 'outlined'}
                onClick={() => {
                  if (studioView === 'draft') {
                    return;
                  }
                  requestProjectEditLeave(() => {
                    if (mode === 'active') {
                      setProjectStudioPreloadSuppressed(true);
                    }
                    setStudioView('draft');
                    clearLoadedProject();
                  });
                }}
              >
                {mode === 'active' ? 'Active' : 'Draft'}
              </Button>
              <Button
                variant={studioView === 'edit' ? 'contained' : 'outlined'}
                onClick={() => {
                  if (studioView === 'edit') {
                    return;
                  }
                  requestProjectEditLeave(() => {
                    if (mode === 'active') {
                      setProjectStudioPreloadSuppressed(false);
                    }
                    setStudioView('edit');
                  });
                }}
              >
                Edit
              </Button>
            </ButtonGroup>
          )}
        </Box>
      </Stack>

      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      {isProjectEdit && !isProjectStudioEditView && (
        <Button variant="outlined" onClick={() => requestProjectEditLeave(() => navigate(-1))} sx={{ mb: 2 }}>
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

      {isEditorView && selectedProject && !isStudioEditView && !isProjectStudioEditView && projectDetailsPanel}

      {showAdminEditTools && (
        <Grid
          container
          rowSpacing={(isProjectStudioEditView || isStudioEditView) && selectedProject ? 6 : 3}
          columnSpacing={(isProjectStudioEditView || isStudioEditView) && selectedProject ? 5 : 3}
          sx={{ mb: 4 }}
        >
          <Grid item xs={12} lg={showCreationStudio || isStudioEditView || isProjectStudioEditView ? 5 : 7}>
            <Paper component="form" onSubmit={saveProject} sx={{ p: 3, height: '100%' }}>
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
                            loadProjectIntoForm(project);
                          } else {
                            clearLoadedProject();
                          }
                        }}
                      >
                        <MenuItem value="">{isProjectStudioEditView ? 'Select active project' : 'Select draft project'}</MenuItem>
                        {projects.filter(project => !project.archived && (
                          isProjectStudioEditView
                            ? ['ACTIVE', 'IN_REVIEW'].includes(project.projectStatus)
                            : project.projectStatus === 'DRAFT'
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
                    <TextField label="Project ID" fullWidth value={projectForm.projectID ? `#${projectForm.projectID}` : ''} InputProps={{ readOnly: true }} />
                  </Grid>
                )}
                <Grid item xs={12} md={isEditorView ? 6 : 12}>
                  <TextField label="Project name" fullWidth value={projectForm.projectName} onChange={event => setProjectForm(current => ({ ...current, projectName: event.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Description" fullWidth multiline minRows={3} value={projectForm.description} onChange={event => setProjectForm(current => ({ ...current, description: event.target.value }))} />
                </Grid>
                <Grid item xs={12} md={showCreationStudio ? 12 : 6}>
                  <TextField label="Budget" type="number" fullWidth value={projectForm.budget} onChange={event => setProjectForm(current => ({ ...current, budget: event.target.value }))} />
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
                      onChange={event => setProjectForm(current => ({ ...current, teamIDs: event.target.value }))}
                      renderValue={selected => selected.map(teamID => teams.find(team => team.teamID === Number(teamID))?.teamName || `Team #${teamID}`).join(', ')}
                    >
                      {projectTeamSelectOptions.map(team => (
                        <MenuItem key={team.teamID} value={team.teamID}>
                          {team.teamName || `Team #${team.teamID}`}{!(team.workers || []).length ? ' (empty)' : ''}
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
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving || ((isStudioEditView || isProjectStudioEditView) && !selectedProject)}>
                    Save
                  </Button>
                )}
                {isStudioEditView && selectedProject?.projectStatus === 'DRAFT' && (
                  <Button
                    variant="contained"
                    startIcon={<RocketLaunchIcon />}
                    disabled={saving || Boolean(selectedProject.associatedActiveProject || projectForm.associatedActiveProjectID)}
                    onClick={() => requestLaunchProject(selectedProject)}
                  >
                    Launch Project
                  </Button>
                )}
                {isStudioEditView && selectedProject?.projectStatus === 'DRAFT' && (
                  <Button
                    variant="outlined"
                    color="warning"
                    disabled={saving}
                    onClick={() => archiveProject(selectedProject)}
                  >
                    Archive Draft
                  </Button>
                )}
                {isStudioEditView && selectedProject?.projectStatus === 'DRAFT' && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    disabled={saving}
                    onClick={() => deleteDraftProject(selectedProject)}
                  >
                    Delete Permanently
                  </Button>
                )}
                {isActiveProjectEditor && selectedProject?.projectStatus === 'ACTIVE' && (
                  <Button
                    variant="contained"
                    color="success"
                    disabled={saving || !projectWorkOrdersAreComplete(selectedProject) || projectHasEmptyAssociatedTeam(selectedProject)}
                    onClick={() => submitProjectForReview(selectedProject)}
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
              {isStudioEditView && selectedProject?.projectStatus === 'DRAFT' && selectedProject.associatedActiveProject && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Attached draft projects cannot be launched as new active projects.
                </Typography>
              )}
            </Paper>
          </Grid>

          {isProjectStudioEditView && selectedProject && (
          <Grid item xs={12} lg={7}>
            {projectDetailsPanel}
          </Grid>
          )}

          {showCreationStudio && (
          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {draftStudioProjectTableView === 'active' ? 'Active Projects' : 'Draft Projects'}
                  </Typography>
                  <ButtonGroup size="small" variant="outlined" aria-label="Draft Studio project table view">
                    <Button
                      variant={draftStudioProjectTableView === 'draft' ? 'contained' : 'outlined'}
                      onClick={() => setDraftStudioProjectTableView('draft')}
                    >
                      Draft
                    </Button>
                    <Button
                      variant={draftStudioProjectTableView === 'active' ? 'contained' : 'outlined'}
                      onClick={() => setDraftStudioProjectTableView('active')}
                    >
                      Active
                    </Button>
                  </ButtonGroup>
                </Box>
                <Stack direction="row" spacing={1} justifyContent={{ xs: 'space-between', sm: 'flex-end' }} alignItems="center">
                  <Chip label={`${draftStudioProjectTableProjects.length} ${draftStudioProjectTableView === 'active' ? 'active' : 'drafts'}`} />
                </Stack>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Budget</TableCell>
                      <TableCell>{draftStudioProjectTableView === 'active' ? 'Actual' : 'Estimated'}</TableCell>
                      <TableCell>Teams</TableCell>
                      <TableCell>Work Orders</TableCell>
                      <TableCell>Updated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {draftStudioProjectTableProjects.map(project => (
                      <TableRow key={project.projectID} hover>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => openDraftStudioProjectForEdit(project)}
                            sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                          >
                            {project.projectName || `Project #${project.projectID}`}
                          </Button>
                        </TableCell>
                        <TableCell>{formatMoney(project.budget)}</TableCell>
                        <TableCell>{formatMoney(draftStudioProjectTableView === 'active' ? project.actualCost : projectDraftEstimatedCost(project))}</TableCell>
                        <TableCell>{plannedTeamCount(project)}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setProjectWorkOrdersDialog(project)}
                          >
                            {projectWorkOrderCount(project)}
                          </Button>
                        </TableCell>
                        <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
                      </TableRow>
                    ))}
                    {!draftStudioProjectTableProjects.length && (
                      <TableRow>
                        <TableCell colSpan={6}>No {draftStudioProjectTableView} projects found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          )}

          {isStudioEditView && selectedProject && (
          <Grid item xs={12} lg={7}>
            {projectDetailsPanel}
          </Grid>
          )}

          {isEditorView && selectedProject && (
          <Grid item xs={12} lg={5} sx={{ mt: (isProjectStudioEditView || isStudioEditView) ? 4 : 0 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <GroupsIcon color="primary" />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {isStudioEditView ? 'Planned Staffing' : 'Project Teams'}
                    </Typography>
                    {isStudioEditView && (
                      <Typography variant="body2" color="text.secondary">
                        Plan staffing without creating active team history.
                      </Typography>
                    )}
                  </Box>
                </Stack>
                {isStudioEditView && (
                  <ButtonGroup size="small">
                    <Button
                      variant={draftTeamView === 'planned' ? 'contained' : 'outlined'}
                      onClick={() => setDraftTeamView('planned')}
                    >
                      Staffing Table
                    </Button>
                    <Button
                      variant={draftTeamView === 'builder' ? 'contained' : 'outlined'}
                      onClick={() => setDraftTeamView('builder')}
                    >
                      Build Staffing
                    </Button>
                  </ButtonGroup>
                )}
              </Stack>

              {isStudioEditView && draftTeamView === 'builder' ? (
                <Stack spacing={2}>
                  <TextField
                    label="Planned staffing name"
                    value={draftTeamName}
                    onChange={event => setDraftTeamName(event.target.value)}
                    fullWidth
                  />
                  <Typography variant="body2" color="text.secondary">
                    Build draft-only staffing from existing workers, existing team members, or an empty plan to fill later.
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Use workers from teams</InputLabel>
                    <Select
                      multiple
                      value={draftTeamSourceTeamIDs}
                      label="Use workers from teams"
                      onChange={event => setDraftTeamSourceTeamIDs(event.target.value.map(Number))}
                      renderValue={selected => selected
                        .map(teamID => teams.find(team => Number(team.teamID) === Number(teamID))?.teamName || `Team #${teamID}`)
                        .join(', ')}
                    >
                      {draftSourceTeams.map(team => (
                        <MenuItem key={team.teamID} value={team.teamID}>
                          {team.teamName || `Team #${team.teamID}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1.5, maxHeight: 260, overflowY: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Add individual workers</Typography>
                    {availableDraftWorkers.map(worker => {
                      const normalized = normalizeWorker(worker);
                      return (
                        <Stack key={normalized.workerID} direction="row" spacing={1} alignItems="center">
                          <Checkbox
                            checked={draftTeamWorkerIDs.includes(normalized.workerID)}
                            onChange={() => toggleDraftTeamWorker(normalized.workerID)}
                          />
                          <Typography variant="body2">
                            {workerRole(normalized) ? `${workerName(normalized)} - ${workerRole(normalized)}` : workerName(normalized)}
                          </Typography>
                        </Stack>
                      );
                    })}
                    {!availableDraftWorkers.length && (
                      <Typography variant="body2" color="text.secondary">No workers are available.</Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setDraftTeamName('');
                        setDraftTeamWorkerIDs([]);
                        setDraftTeamSourceTeamIDs([]);
                        setDraftTeamView('planned');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="contained" disabled={saving} onClick={saveDraftOnlyTeam}>
                      Save Planned Staffing
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>{isStudioEditView ? 'Add existing team as staffing' : 'Add existing team'}</InputLabel>
                    <Select
                      value=""
                      label={isStudioEditView ? 'Add existing team as staffing' : 'Add existing team'}
                      onChange={event => addProjectTeam(event.target.value)}
                    >
                      <MenuItem value="">Select team</MenuItem>
                      {assignableTeams.filter(team => !selectedProjectTeamIDs.includes(team.teamID)).map(team => (
                        <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {plannedTeamsForProject(selectedProject).map(team => (
                      <Box key={team.teamID} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{isStudioEditView ? (team.teamName || `Planned staffing #${team.teamID}`) : (team.teamName || `Team #${team.teamID}`)}</Typography>
                            {Number(team.teamID) < 0 && <Chip size="small" label="Draft-only" />}
                          </Stack>
                          <Button size="small" color="error" disabled={saving} onClick={() => removePlannedTeam(team.teamID)}>
                            Remove
                          </Button>
                        </Stack>
                        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                          {staffingSlotsFor(team).map((slot, index) => {
                            const worker = normalizeWorker(slot.worker || slot);
                            const hasWorker = Boolean(worker.workerID);
                            const label = hasWorker
                              ? (slot.roleName || workerRole(worker)
                                ? `${workerName(worker)} - ${slot.roleName || workerRole(worker)}`
                                : workerName(worker))
                              : (slot.roleName || 'Open staffing slot');
                            return <Chip key={slot.id || slot.workerID || worker.workerID || index} size="small" label={label} />;
                          })}
                          {!staffingSlotsFor(team).length && <Typography variant="body2" color="text.secondary">{isStudioEditView ? 'Open staffing slot' : 'No workers'}</Typography>}
                        </Stack>
                      </Box>
                    ))}
                    {!plannedTeamsForProject(selectedProject).length && (
                      <Typography variant="body2" color="text.secondary">
                        {isStudioEditView ? 'No planned staffing is saved for this draft project.' : 'No teams are attached to this project.'}
                      </Typography>
                    )}
                    </Stack>
                </>
              )}
            </Paper>
          </Grid>
          )}

          {isEditorView && selectedProject && (
          <Grid item xs={12} lg={7} sx={{ mt: (isProjectStudioEditView || isStudioEditView) ? 4 : 0 }}>
            <Paper component="form" onSubmit={createAndAttachWorkOrder} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {selectedWorkOrderProject?.projectStatus === 'ACTIVE' ? 'Work Orders For Project' : 'Draft Work Orders For Project'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Attach existing work order</InputLabel>
                    <Select
                      value={workOrderForm.existingWorkOrderID}
                      label="Attach existing work order"
                      onChange={event => setWorkOrderForm(current => ({
                        ...current,
                        existingWorkOrderID: event.target.value,
                        teamID: event.target.value ? '' : current.teamID,
                        companyID: event.target.value ? '' : current.companyID,
                      }))}
                    >
                      <MenuItem value="">Create new</MenuItem>
                      {attachableWorkOrders.map(workOrder => (
                        <MenuItem key={workOrder.workOrderID} value={workOrder.workOrderID}>
                          #{workOrder.workOrderID} - {workOrder.company?.companyName || 'No company'} ({workOrder.status.replaceAll('_', ' ')})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Team</InputLabel>
                    <Select
                      value={workOrderForm.teamID}
                      label="Team"
                      disabled={Boolean(workOrderForm.existingWorkOrderID)}
                      onChange={event => setWorkOrderForm(current => ({ ...current, teamID: event.target.value }))}
                    >
                      <MenuItem value="">{selectedWorkOrderProject?.projectStatus === 'ACTIVE' ? 'No team selected (open)' : 'No team selected'}</MenuItem>
                      {assignableTeams.map(team => (
                        <MenuItem key={team.teamID} value={team.teamID}>{team.teamName || `Team #${team.teamID}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Company</InputLabel>
                    <Select
                      value={workOrderForm.companyID}
                      label="Company"
                      disabled={Boolean(workOrderForm.existingWorkOrderID)}
                      onChange={event => setWorkOrderForm(current => ({ ...current, companyID: event.target.value }))}
                    >
                      <MenuItem value="">No company selected</MenuItem>
                      {companies.map(company => (
                        <MenuItem key={company.companyID} value={company.companyID}>{company.companyName || `Company #${company.companyID}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                  !['DRAFT', 'ACTIVE'].includes(selectedWorkOrderProject?.projectStatus)
                }
              >
                {workOrderForm.existingWorkOrderID
                  ? (selectedWorkOrderProject?.projectStatus === 'DRAFT' ? 'Create Draft Copy' : 'Attach Work Order')
                  : (selectedWorkOrderProject?.projectStatus === 'ACTIVE' ? 'Create Work Order' : 'Create Draft')}
              </Button>
              {selectedWorkOrderProject && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Associated Work Orders</Typography>
                  <TableContainer sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Work Order</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Company</TableCell>
                          <TableCell>Team</TableCell>
                          <TableCell align="right">Cost</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {associatedWorkOrdersFor(selectedWorkOrderProject).map(workOrder => {
                          const team = teamForWorkOrder(selectedWorkOrderProject, workOrder);
                          const workersOutsideTeam = workersOutsideWorkOrderTeam(selectedWorkOrderProject, workOrder);
                          return (
                            <TableRow key={`${workOrder.status || 'UNKNOWN'}-${workOrder.workOrderID}`}>
                              <TableCell>
                                <Stack spacing={0.5}>
                                  <Typography variant="body2">#{workOrder.workOrderID}</Typography>
                                  {workOrder.status === 'DRAFT' && workOrder.workOrderName && (
                                    <Typography variant="caption" color="text.secondary">{workOrder.workOrderName}</Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>{(workOrder.status || 'UNKNOWN').replaceAll('_', ' ')}</TableCell>
                              <TableCell>{workOrder.company?.companyName || workOrder.plannedCompanyName || 'No company'}</TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setWorkOrderTeamsDialog({
                                    workOrder,
                                    team,
                                    workersOutsideTeam,
                                  })}
                                >
                                  {workOrderTeamName(selectedWorkOrderProject, workOrder)}
                                </Button>
                              </TableCell>
                              <TableCell align="right">{formatMoney(workOrderCost(workOrder))}</TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button size="small" variant="outlined" onClick={() => editAssociatedWorkOrder(selectedWorkOrderProject, workOrder)}>
                                    Manage
                                  </Button>
                                  <Button size="small" variant="outlined" color="error" disabled={saving} onClick={() => removeAssociatedWorkOrder(selectedWorkOrderProject, workOrder)}>
                                    {workOrder.status === 'DRAFT' ? 'Archive' : 'Remove'}
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {!associatedWorkOrdersFor(selectedWorkOrderProject).length && (
                          <TableRow>
                            <TableCell colSpan={6}>No work orders for this project.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          </Grid>
          )}

          {isEditorView && selectedProject && (
          <Grid item xs={12} lg={5} sx={{ mt: (isProjectStudioEditView || isStudioEditView) ? 4 : 0 }}>
            <Paper component="form" onSubmit={addComment} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {isStudioEditView ? 'Draft Project Comments' : 'Project Comment'}
              </Typography>
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
              <Button type="submit" variant="contained" disabled={saving || !(isEditorView && selectedProject ? selectedProject.projectID : commentProjectID) || !commentType || !commentText.trim()}>
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
                title={isStudioEditView ? 'Draft Project Documents' : 'Project Documents'}
                emptyMessage="No documents are attached to this project."
              />
            </Grid>
          )}
        </Grid>
      )}

      {isEditorView && actionItemsPanel}

      {isProjectStudioEditView && (
        <Grid container spacing={3} sx={{ mt: 3, mb: 3 }}>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Review Projects</Typography>
                <Chip label={`${reviewProjects.length} waiting`} />
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Work Orders</TableCell>
                      <TableCell>Updated</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reviewProjects.map(project => (
                      <TableRow key={project.projectID}>
                        <TableCell>
                          <Button size="small" onClick={() => navigate(`/admin/projects/${project.projectID}`)} sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}>
                            {project.projectName || `Project #${project.projectID}`}
                          </Button>
                        </TableCell>
                        <TableCell>{(project.workOrders || []).length || project.workOrderCount || 0}</TableCell>
                        <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="contained" color="success" disabled={saving} onClick={() => approveProject(project)}>
                              Approve
                            </Button>
                            <Button size="small" variant="outlined" color="error" disabled={saving} onClick={() => denyProject(project)}>
                              Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!reviewProjects.length && (
                      <TableRow>
                        <TableCell colSpan={4}>No projects are waiting for review.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Projects</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>Completion</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {archiveProjects.map(project => (
                      <TableRow key={project.projectID}>
                        <TableCell>
                          <Button size="small" onClick={() => navigate(`/admin/projects/${project.projectID}`)} sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}>
                            {project.projectName || `Project #${project.projectID}`}
                          </Button>
                        </TableCell>
                        <TableCell>{project.projectStatus.replaceAll('_', ' ')}</TableCell>
                        <TableCell>{formatDateTime(project.activatedAt || project.projectStartedAt || project.startedAt)}</TableCell>
                        <TableCell>{formatDateTime(project.completedAt)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" color="warning" disabled={saving || !projectReadyToArchive(project)} onClick={() => archiveProject(project)}>
                            Archive
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!archiveProjects.length && (
                      <TableRow>
                        <TableCell colSpan={5}>No projects are available for archiving.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

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
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleProjects.map(project => (
                <TableRow key={project.projectID} hover>
                  <TableCell>
                    {mode === 'active' || isStudioEditView ? (
                      <Button
                        size="small"
                        onClick={() => openProjectFromList(project)}
                        sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                      >
                        {project.projectName || `Project #${project.projectID}`}
                      </Button>
                    ) : (
                      <Typography variant="subtitle2">{project.projectName || `Project #${project.projectID}`}</Typography>
                    )}
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
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setProjectTeamsDialog(project)}
                    >
                      {plannedTeamCount(project)}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setProjectWorkOrdersDialog(project)}
                    >
                      {projectWorkOrderCount(project)}
                    </Button>
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
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setProjectCommentsDialog(project)}
                    >
                      {(project.comments || []).length ? 'Yes' : 'No'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setProjectActionItemsDialog(project)}
                    >
                      {(project.actionItems || []).filter(item => item.completed).length}/{(project.actionItems || []).length}
                    </Button>
                  </TableCell>
                  <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
                </TableRow>
              ))}
              {!visibleProjects.length && (
                <TableRow>
                  <TableCell colSpan={mode === 'active' ? 10 : 9}>No projects found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      )}

      <Dialog open={Boolean(launchSignatureProject)} onClose={() => setLaunchSignatureProject(null)} fullWidth maxWidth="sm">
        <DialogTitle>Launch Project Signature</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              A signature is required before this draft can be launched as an active project.
            </Typography>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Draft work orders to create on launch</Typography>
              {(launchSignatureProject?.draftWorkOrders || []).map(workOrder => (
                <Stack key={workOrder.workOrderID} direction="row" spacing={1} alignItems="center">
                  <Checkbox
                    checked={launchDraftWorkOrderIDs.includes(workOrder.workOrderID)}
                    onChange={event => setLaunchDraftWorkOrderIDs(current => (
                      event.target.checked
                        ? Array.from(new Set([...current, workOrder.workOrderID]))
                        : current.filter(id => id !== workOrder.workOrderID)
                    ))}
                  />
                  <Typography variant="body2">
                    #{workOrder.workOrderID} - {workOrder.plannedTeamName || 'No planned team'}
                  </Typography>
                </Stack>
              ))}
              {!(launchSignatureProject?.draftWorkOrders || []).length && (
                <Typography variant="body2" color="text.secondary">
                  No draft work orders will be created.
                </Typography>
              )}
            </Box>
            <TextField
              label="Signature"
              fullWidth
              value={launchSignature}
              onChange={event => setLaunchSignature(event.target.value)}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLaunchSignatureProject(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" startIcon={<RocketLaunchIcon />} disabled={saving || !launchSignature.trim()} onClick={launchProject}>
            Launch Project
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(draftStudioProjectDetailsDialog)} onClose={() => setDraftStudioProjectDetailsDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>{draftStudioProjectDetailsDialog?.projectName || 'Project Details'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip size="small" label={draftStudioProjectDetailsDialog?.projectStatus || 'UNKNOWN'} />
              <Chip size="small" label={`Budget ${formatMoney(draftStudioProjectDetailsDialog?.budget)}`} />
              <Chip
                size="small"
                label={
                  draftStudioProjectDetailsDialog?.projectStatus === 'ACTIVE'
                    ? `Actual ${formatMoney(draftStudioProjectDetailsDialog?.actualCost)}`
                    : `Estimated ${formatMoney(projectDraftEstimatedCost(draftStudioProjectDetailsDialog || {}))}`
                }
              />
            </Stack>
            {draftStudioProjectDetailsDialog?.description && (
              <Typography variant="body2">{draftStudioProjectDetailsDialog.description}</Typography>
            )}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Teams</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {(draftStudioProjectDetailsDialog?.teams || []).map(team => (
                  <Chip key={team.teamID} size="small" label={team.teamName || `Team #${team.teamID}`} />
                ))}
                {!(draftStudioProjectDetailsDialog?.teams || []).length && <Chip size="small" label="No teams" />}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Work Orders</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Work Order</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Workers</TableCell>
                      <TableCell align="right">Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {associatedWorkOrdersFor(draftStudioProjectDetailsDialog || {}).map(workOrder => (
                      <TableRow key={`${workOrder.status || 'UNKNOWN'}-${workOrder.workOrderID}`}>
                        <TableCell>#{workOrder.workOrderID}</TableCell>
                        <TableCell>{(workOrder.status || 'UNKNOWN').replaceAll('_', ' ')}</TableCell>
                        <TableCell>{workOrder.company?.companyName || workOrder.plannedCompanyName || 'No company'}</TableCell>
                        <TableCell>{getWorkOrderWorkers(workOrder).map(workerName).join(', ') || 'Unassigned'}</TableCell>
                        <TableCell align="right">{formatMoney(workOrderCost(workOrder))}</TableCell>
                      </TableRow>
                    ))}
                    {!associatedWorkOrdersFor(draftStudioProjectDetailsDialog || {}).length && (
                      <TableRow>
                        <TableCell colSpan={5}>No work orders are associated with this project.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDraftStudioProjectDetailsDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(workOrderTeamsDialog)} onClose={() => setWorkOrderTeamsDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Work Order #{workOrderTeamsDialog?.workOrder?.workOrderID} Teams</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {workOrderTeamsDialog?.team
                  ? workOrderTeamsDialog.team.teamName || `Team #${workOrderTeamsDialog.team.teamID}`
                  : 'Team Members'}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(workOrderTeamsDialog?.team?.workers || []).map(worker => (
                      <TableRow key={normalizeWorker(worker).workerID}>
                        <TableCell>{workerName(normalizeWorker(worker))}</TableCell>
                      </TableRow>
                    ))}
                    {!(workOrderTeamsDialog?.team?.workers || []).length && (
                      <TableRow>
                        <TableCell>
                          {workOrderTeamsDialog?.team ? 'No members are listed for this team.' : 'No team is associated with this work order.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Assigned Workers Outside Team</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Worker</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(workOrderTeamsDialog?.workersOutsideTeam || []).map(worker => (
                      <TableRow key={worker.workerID}>
                        <TableCell>{workerName(worker)}</TableCell>
                      </TableRow>
                    ))}
                    {!(workOrderTeamsDialog?.workersOutsideTeam || []).length && (
                      <TableRow>
                        <TableCell>No separately assigned workers.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkOrderTeamsDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(projectTeamsDialog)} onClose={() => setProjectTeamsDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{projectTeamsDialog?.projectName || 'Project'} Teams</DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell>Workers</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plannedTeamsForProject(projectTeamsDialog || {}).map(team => (
                  <TableRow key={team.teamID}>
                    <TableCell>{team.teamName || `Team #${team.teamID}`}</TableCell>
                    <TableCell>
                      {(team.workers || []).length
                        ? (team.workers || []).map(worker => workerName(normalizeWorker(worker))).join(', ')
                        : <Chip size="small" color="warning" label="Associated team is empty" />}
                    </TableCell>
                  </TableRow>
                ))}
                {!plannedTeamsForProject(projectTeamsDialog || {}).length && (
                  <TableRow>
                    <TableCell colSpan={2}>
                      {projectTeamsDialog?.projectStatus === 'DRAFT'
                        ? 'No planned staffing is saved for this draft project.'
                        : 'No teams are associated with this project.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectTeamsDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(projectCommentsDialog)} onClose={() => setProjectCommentsDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>{projectCommentsDialog?.projectName || 'Project'} Comments</DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(projectCommentsDialog?.comments || []).map(comment => (
                  <TableRow key={comment.projectCommentID || comment.commentID || `${comment.commentType}-${comment.createdAt}`}>
                    <TableCell>{comment.commentType || 'GENERAL'}</TableCell>
                    <TableCell>{comment.commentText || comment.text || 'No comment text'}</TableCell>
                    <TableCell>{comment.author ? workerName(normalizeWorker(comment.author)) : 'Unknown'}</TableCell>
                    <TableCell>{formatDateTime(comment.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {!(projectCommentsDialog?.comments || []).length && (
                  <TableRow>
                    <TableCell colSpan={4}>No comments are associated with this project.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectCommentsDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(projectActionItemsDialog)} onClose={() => setProjectActionItemsDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>{projectActionItemsDialog?.projectName || 'Project'} Action Items</DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Action Item</TableCell>
                  <TableCell>Assigned To</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(projectActionItemsDialog?.actionItems || []).map(item => (
                  <TableRow key={item.actionItemID}>
                    <TableCell>
                      <Chip size="small" color={item.completed ? 'success' : 'default'} label={item.completed ? 'Done' : 'Open'} />
                    </TableCell>
                    <TableCell>{item.itemText || 'Untitled action item'}</TableCell>
                    <TableCell>
                      {item.assignedWorker
                        ? workerName(normalizeWorker(item.assignedWorker))
                        : item.assignedTeam?.teamName || 'General'}
                    </TableCell>
                  </TableRow>
                ))}
                {!(projectActionItemsDialog?.actionItems || []).length && (
                  <TableRow>
                    <TableCell colSpan={3}>No action items for this project.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectActionItemsDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(projectWorkOrdersDialog)} onClose={() => setProjectWorkOrdersDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>{projectWorkOrdersDialog?.projectName || 'Project'} Work Orders</DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Work Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Workers</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...(projectWorkOrdersDialog?.workOrders || []), ...(projectWorkOrdersDialog?.draftWorkOrders || [])].map(workOrder => (
                  <TableRow key={`${workOrder.status || 'UNKNOWN'}-${workOrder.workOrderID}`}>
                    <TableCell>
                      {workOrder.status === 'DRAFT' ? (
                        `#${workOrder.workOrderID}`
                      ) : (
                        <Button
                          size="small"
                          onClick={() => navigate(`/admin/workorders/${workOrder.workOrderID}`)}
                          sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}
                        >
                          #{workOrder.workOrderID}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={(workOrder.status || 'UNKNOWN').replaceAll('_', ' ')} />
                    </TableCell>
                    <TableCell>{workOrder.company?.companyName || workOrder.plannedCompanyName || 'No company'}</TableCell>
                    <TableCell>{getWorkOrderWorkers(workOrder).map(workerName).join(', ') || 'Unassigned'}</TableCell>
                    <TableCell align="right">{formatMoney(workOrderCost(workOrder))}</TableCell>
                  </TableRow>
                ))}
                {![...(projectWorkOrdersDialog?.workOrders || []), ...(projectWorkOrdersDialog?.draftWorkOrders || [])].length && (
                  <TableRow>
                    <TableCell colSpan={5}>No work orders are associated with this project.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectWorkOrdersDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

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
