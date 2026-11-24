import React from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatMoney } from '../../model';
import { useAuth } from '../../Components/AuthContext';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { MetricSummary } from '../../shared/components/metrics';
import { projectPathFor, workOrderPathFor } from '../../shared/routing/rolePaths';
import { AppAlert, icons } from '../../shared/icons';
import ProjectList from './components/ProjectList';
import ProjectForm from './components/ProjectForm';
import ProjectWorkspace from './components/ProjectWorkspace';
import useProjectsPage from './hooks/useProjectsPage';

function PortfolioSummary({ projects }) {
  const metrics = [
    {
      label: 'Active Projects',
      value: projects.filter(project => project.projectStatus !== 'COMPLETE').length,
      detail: 'Currently underway',
      icon: icons.projects,
    },
    {
      label: 'Planning',
      value: projects.filter(project => (project.projectStatus || 'OPEN') === 'OPEN').length,
      detail: 'Open projects',
      icon: icons.projectStudio,
    },
    {
      label: 'Needs Review',
      value: projects.filter(project => project.projectStatus === 'IN_REVIEW').length,
      detail: 'Awaiting review',
      icon: icons.warning,
    },
    {
      label: 'Total Budget',
      value: formatMoney(projects.reduce((total, project) => total + Number(project.budget || 0), 0)),
      detail: 'Across the portfolio',
      icon: null,
    },
  ];

  return <MetricSummary metrics={metrics} ariaLabel="Project summary" />;
}

const ProjectPageContent = ({ mode, title, subtitle, routeProjectID }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWorkerEdit = mode === 'worker-edit';
  const canManage = user?.isAdmin === true && !isWorkerEdit;
  const isCreating = mode === 'create';
  const isEditing = mode === 'edit';
  const isPortfolio = mode === 'active';
  const workspacePath = routeProjectID ? projectPathFor(user, routeProjectID) : '/admin/projects/active';
  const {
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
    updateProjectForm,
    resetProjectForm,
    saveProject,
    updateWorkOrderForm,
    attachOrCreateWorkOrder,
    removeWorkOrder,
    setCommentText,
    setCommentType,
    addComment,
    setActionItemText,
    setActionItemCompleted,
    addActionItem,
    runProjectAction,
  } = useProjectsPage({
    routeProjectID,
    canManage,
    mode,
    onSaved: project => {
      const projectID = project?.projectID || (isEditing ? routeProjectID : null);
      navigate(projectID ? projectPathFor(user, projectID) : '/admin/projects/active', { replace: true });
    },
  });

  const projectWorkspace = selectedProject && !isEditing ? (
    <ProjectWorkspace
      project={selectedProject}
      canManage={canManage && !selectedProject.archived}
      workOrderForm={workOrderForm}
      workOrders={attachableWorkOrders}
      teams={teams}
      companies={companies}
      saving={saving}
      commentText={commentText}
      commentType={commentType}
      actionItemText={actionItemText}
      onWorkOrderFormChange={updateWorkOrderForm}
      onOpenWorkOrder={order => navigate(workOrderPathFor(user, order.workOrderID))}
      onRemoveWorkOrder={removeWorkOrder}
      onAttachWorkOrder={attachOrCreateWorkOrder}
      onCommentTextChange={setCommentText}
      onCommentTypeChange={setCommentType}
      onAddComment={addComment}
      onActionItemTextChange={setActionItemText}
      onToggleActionItem={setActionItemCompleted}
      onAddActionItem={addActionItem}
      onRunProjectAction={runProjectAction}
    />
  ) : null;

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  const pageTitle = isEditing ? 'Edit Project'
    : selectedProject ? selectedProject.projectName || `Project #${selectedProject.projectID}`
      : title || (isCreating ? 'Project Planner' : isPortfolio ? 'Active Projects' : 'Project Workspace');

  return (
    <PageContainer>
      <PageHeader
        title={pageTitle}
        subtitle={selectedProject ? selectedProject.description : subtitle}
        context={selectedProject && (
          <Chip
            size="small"
            label={selectedProject.archived ? 'Archived' : (selectedProject.projectStatus || 'OPEN').replaceAll('_', ' ')}
            sx={{ mb: 1 }}
          />
        )}
      />
      <PageSections>
      {message && <AppAlert severity={message.severity}>{message.text}</AppAlert>}

      {!isPortfolio && <Stack direction="row" spacing={1}>
        {!isPortfolio && !isWorkerEdit && (
          <Button component={Link} to={isEditing ? workspacePath : '/admin/projects/active'}>
            {isEditing ? 'Project Workspace' : 'Active Projects'}
          </Button>
        )}
        {selectedProject && canManage && !isEditing && !selectedProject.archived && (
          <Button component={Link} to={`/admin/projects/${selectedProject.projectID}/edit`} variant="outlined">
            Edit Project
          </Button>
        )}
      </Stack>}

      {isCreating && <PortfolioSummary projects={visibleProjects} />}
      {isPortfolio && (
        <ProjectList
          projects={visibleProjects}
          canManage={canManage}
          onEdit={project => navigate(`/admin/projects/${project.projectID}/edit`)}
          onOpen={project => navigate(projectPathFor(user, project.projectID))}
        />
      )}

      {routeProjectID && !selectedProject && !message && (
        <AppAlert severity="warning">Project not found.</AppAlert>
      )}

      {canManage && (isCreating || (isEditing && selectedProject)) && (
        <ProjectForm
          mode={isEditing ? 'edit' : 'create'}
          form={projectForm}
          project={selectedProject}
          teams={teams}
          saving={saving}
          onChange={updateProjectForm}
          onReset={resetProjectForm}
          onSubmit={saveProject}
          onCancel={() => navigate(workspacePath)}
        />
      )}

      {projectWorkspace}
      </PageSections>
    </PageContainer>
  );
};

const ProjectsPage = ({ mode = 'active', ...props }) => {
  const { projectID } = useParams();
  return <ProjectPageContent key={`${mode}:${projectID || 'new'}`} mode={mode} routeProjectID={projectID} {...props} />;
};

export default ProjectsPage;
