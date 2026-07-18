import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import WorkOrderDocuments from './WorkOrderDocuments';
import { useAuth } from './AuthContext';
import { projectPathFor, workOrderPathFor } from '../shared/routing/rolePaths';
import ProjectList from './projects/ProjectList';
import ProjectForm from './projects/ProjectForm';
import ProjectWorkOrders from './projects/ProjectWorkOrders';
import ProjectComments from './projects/ProjectComments';
import ProjectActionItems from './projects/ProjectActionItems';

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
        apiFetch('/projects'),
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
  const attachableWorkOrders = workOrders.filter(order => (
    !order.archived &&
    ['OPEN', 'IN_PROCESS'].includes(order.status) &&
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

      {!routeProjectID && <ProjectList projects={visibleProjects} canManage={canManage} onEdit={loadProjectIntoForm} onOpen={project => navigate(projectPathFor(user, project.projectID))} />}

      {canManage && <ProjectForm form={projectForm} teams={teams} saving={saving} onChange={changes => setProjectForm(current => ({ ...current, ...changes }))} onReset={() => setProjectForm(emptyProjectForm)} onSubmit={saveProject} />}

      {selectedProject && (
        <Stack spacing={4}>
          <ProjectWorkOrders project={selectedProject} canManage={canManage} form={workOrderForm} workOrders={attachableWorkOrders} teams={teams} companies={companies} saving={saving} onFormChange={changes => setWorkOrderForm(current => ({ ...current, ...changes }))} onOpen={order => navigate(workOrderPathFor(user, order.workOrderID))} onRemove={removeWorkOrder} onSubmit={attachOrCreateWorkOrder} />

          <ProjectComments comments={selectedProject.comments || []} commentText={commentText} commentType={commentType} commentTypes={COMMENT_TYPES} saving={saving} canEdit={!selectedProject.archived && selectedProject.projectStatus !== 'COMPLETE'} onTextChange={setCommentText} onTypeChange={setCommentType} onSubmit={addComment} />

          <ProjectActionItems items={selectedProject.actionItems || []} text={actionItemText} saving={saving} canEdit={!selectedProject.archived && selectedProject.projectStatus !== 'COMPLETE'} onTextChange={setActionItemText} onToggle={setActionItemCompleted} onSubmit={addActionItem} />

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
