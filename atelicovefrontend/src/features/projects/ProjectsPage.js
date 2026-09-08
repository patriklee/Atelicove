import React, { useRef } from 'react';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
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

function StudioSummary({ projects }) {
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

const ProjectsPage = ({ mode = 'active', title = 'Project Studio', subtitle = '' }) => {
  const { projectID: routeProjectID } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const plannerRef = useRef(null);
  const isWorkerEdit = mode === 'worker-edit';
  const canManage = user?.isAdmin === true && !isWorkerEdit;
  const isStudio = mode === 'active' && !routeProjectID;
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
    selectProject,
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
  } = useProjectsPage({ routeProjectID, canManage });

  const projectWorkspace = selectedProject ? (
    <ProjectWorkspace
      project={selectedProject}
      canManage={canManage}
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

  if (isStudio) {
    return (
      <PageContainer>
        <PageHeader title={title} subtitle={subtitle} />

        {message && <AppAlert severity={message.severity} sx={{ mb: 3 }}>{message.text}</AppAlert>}

        <PageSections>
          <StudioSummary projects={visibleProjects} />

          {canManage && (
            <Box ref={plannerRef} sx={{ scrollMarginTop: 24 }}>
              <ProjectForm
                form={projectForm}
                project={selectedProject}
                teams={teams}
                saving={saving}
                onChange={updateProjectForm}
                onReset={resetProjectForm}
                onSubmit={saveProject}
              />
            </Box>
          )}

          <ProjectList
            projects={visibleProjects}
            canManage={canManage}
            onEdit={project => {
              selectProject(project);
              plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onOpen={project => navigate(projectPathFor(user, project.projectID))}
          />

          {projectWorkspace}
        </PageSections>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={subtitle} />
      <PageSections>
      {message && <AppAlert severity={message.severity}>{message.text}</AppAlert>}

      {!routeProjectID && (
        <ProjectList
          projects={visibleProjects}
          canManage={canManage}
          onEdit={selectProject}
          onOpen={project => navigate(projectPathFor(user, project.projectID))}
        />
      )}

      {canManage && (
        <ProjectForm
          form={projectForm}
          teams={teams}
          saving={saving}
          onChange={updateProjectForm}
          onReset={resetProjectForm}
          onSubmit={saveProject}
        />
      )}

      {projectWorkspace}
      </PageSections>
    </PageContainer>
  );
};

export default ProjectsPage;
