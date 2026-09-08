import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../shared/api';

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

const projectPayload = (form) => ({
  projectName: form.projectName.trim() || null,
  description: form.description.trim() || null,
  budget: form.budget === '' ? null : Number(form.budget),
  teamIDs: form.teamIDs.map(Number),
});

const useProjectsPage = ({ routeProjectID, canManage }) => {
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

  const selectProject = useCallback((project) => {
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
    selectProject(projects.find(project => project.projectID === Number(routeProjectID)));
  }, [projects, routeProjectID, selectProject]);

  const replaceProject = (updated) => {
    setProjects(current => current.map(project => (
      project.projectID === updated.projectID ? updated : project
    )));
    selectProject(updated);
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

  return {
    visibleProjects,
    selectedProject,
    attachableWorkOrders,
    teams,
    companies,
    projectForm,
    workOrderForm,
    commentText,
    commentType,
    actionItemText,
    loading,
    saving,
    message,
    selectProject,
    updateProjectForm: changes => setProjectForm(current => ({ ...current, ...changes })),
    resetProjectForm: () => setProjectForm(emptyProjectForm),
    saveProject,
    updateWorkOrderForm: changes => setWorkOrderForm(current => ({ ...current, ...changes })),
    attachOrCreateWorkOrder,
    removeWorkOrder,
    setCommentText,
    setCommentType,
    addComment,
    setActionItemText,
    setActionItemCompleted,
    addActionItem,
    runProjectAction,
  };
};

export default useProjectsPage;
