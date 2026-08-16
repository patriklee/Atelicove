import React, { useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { formatMoney } from '../../model';
import { WorkOrderDocuments } from '../documents';
import { useAuth } from '../../Components/AuthContext';
import { projectPathFor, workOrderPathFor } from '../../shared/routing/rolePaths';
import { AppAlert, AppIcon, icons } from '../../shared/icons';
import ProjectList from './components/ProjectList';
import ProjectForm from './components/ProjectForm';
import ProjectWorkOrders from './components/ProjectWorkOrders';
import ProjectComments from './components/ProjectComments';
import ProjectActionItems from './components/ProjectActionItems';
import useProjectsPage from './hooks/useProjectsPage';

const COMMENT_TYPES = ['GENERAL', 'QUESTION', 'DECISION', 'WARNING', 'UPDATE'];

const studioCardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: theme => theme.customShadows.soft,
  bgcolor: 'background.paper',
};

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

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap: 2 }}>
      {metrics.map(metric => (
        <Paper key={metric.label} sx={{ ...studioCardSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
              <Typography variant="h4" sx={{ mt: 0.5, color: 'text.primary', wordBreak: 'break-word' }}>
                {metric.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">{metric.detail}</Typography>
            </Box>
            {metric.icon && (
              <Box sx={{ p: 1, borderRadius: 2, color: 'brand.secondary', bgcolor: 'brand.soft', display: 'flex' }}>
                <AppIcon icon={metric.icon} size={22} />
              </Box>
            )}
          </Stack>
        </Paper>
      ))}
    </Box>
  );
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

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (isStudio) {
    return (
      <Box sx={{ maxWidth: 1500, mx: 'auto', pb: 8 }}>
        <Stack
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" component="h1" color="text.primary">{title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
          </Box>
        </Stack>

        {message && <AppAlert severity={message.severity} sx={{ mb: 3 }}>{message.text}</AppAlert>}

        <Stack spacing={3}>
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

          {selectedProject && (
            <Stack spacing={4}>
              <ProjectWorkOrders
                project={selectedProject}
                canManage={canManage}
                form={workOrderForm}
                workOrders={attachableWorkOrders}
                teams={teams}
                companies={companies}
                saving={saving}
                onFormChange={updateWorkOrderForm}
                onOpen={order => navigate(workOrderPathFor(user, order.workOrderID))}
                onRemove={removeWorkOrder}
                onSubmit={attachOrCreateWorkOrder}
              />

              <ProjectComments
                comments={selectedProject.comments || []}
                commentText={commentText}
                commentType={commentType}
                commentTypes={COMMENT_TYPES}
                saving={saving}
                canEdit={!selectedProject.archived && selectedProject.projectStatus !== 'COMPLETE'}
                onTextChange={setCommentText}
                onTypeChange={setCommentType}
                onSubmit={addComment}
              />

              <ProjectActionItems
                items={selectedProject.actionItems || []}
                text={actionItemText}
                saving={saving}
                canEdit={!selectedProject.archived && selectedProject.projectStatus !== 'COMPLETE'}
                onTextChange={setActionItemText}
                onToggle={setActionItemCompleted}
                onSubmit={addActionItem}
              />

              <WorkOrderDocuments
                basePath={`/projects/${selectedProject.projectID}/documents`}
                canManage={!selectedProject.archived}
                title="Project Documents"
                emptyMessage="No documents are attached to this project."
              />

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                {selectedProject.projectStatus === 'OPEN' && <Button onClick={() => runProjectAction(`/projects/${selectedProject.projectID}/submit`, { method: 'PUT' }, 'Project submitted for review.')}>Submit for Review</Button>}
                {selectedProject.projectStatus === 'IN_REVIEW' && <Button onClick={() => runProjectAction(`/projects/${selectedProject.projectID}/reject`, { method: 'PUT' }, 'Project returned to open status.')}>Reject</Button>}
                {selectedProject.projectStatus === 'IN_REVIEW' && <Button variant="contained" onClick={() => runProjectAction(`/projects/${selectedProject.projectID}/complete`, { method: 'PUT' }, 'Project completed.')}>Complete</Button>}
                {selectedProject.projectStatus === 'COMPLETE' && <Button color="warning" onClick={() => runProjectAction(`/projects/${selectedProject.projectID}`, { method: 'DELETE' }, 'Project archived.')}>Archive</Button>}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>{subtitle}</Typography>
      {message && <AppAlert severity={message.severity} sx={{ mb: 2 }}>{message.text}</AppAlert>}

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

      {selectedProject && (
        <Stack spacing={4}>
          <ProjectWorkOrders
            project={selectedProject}
            canManage={canManage}
            form={workOrderForm}
            workOrders={attachableWorkOrders}
            teams={teams}
            companies={companies}
            saving={saving}
            onFormChange={updateWorkOrderForm}
            onOpen={order => navigate(workOrderPathFor(user, order.workOrderID))}
            onRemove={removeWorkOrder}
            onSubmit={attachOrCreateWorkOrder}
          />

          <ProjectComments
            comments={selectedProject.comments || []}
            commentText={commentText}
            commentType={commentType}
            commentTypes={COMMENT_TYPES}
            saving={saving}
            canEdit={!selectedProject.archived && selectedProject.projectStatus !== 'COMPLETE'}
            onTextChange={setCommentText}
            onTypeChange={setCommentType}
            onSubmit={addComment}
          />

          <ProjectActionItems
            items={selectedProject.actionItems || []}
            text={actionItemText}
            saving={saving}
            canEdit={!selectedProject.archived && selectedProject.projectStatus !== 'COMPLETE'}
            onTextChange={setActionItemText}
            onToggle={setActionItemCompleted}
            onSubmit={addActionItem}
          />

          <WorkOrderDocuments
            basePath={`/projects/${selectedProject.projectID}/documents`}
            canManage={!selectedProject.archived}
            title="Project Documents"
            emptyMessage="No documents are attached to this project."
          />

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
