import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { WorkOrderDocuments } from '../documents';
import { useAuth } from '../../Components/AuthContext';
import { projectPathFor, workOrderPathFor } from '../../shared/routing/rolePaths';
import { AppAlert } from '../../shared/icons';
import ProjectList from './components/ProjectList';
import ProjectForm from './components/ProjectForm';
import ProjectWorkOrders from './components/ProjectWorkOrders';
import ProjectComments from './components/ProjectComments';
import ProjectActionItems from './components/ProjectActionItems';
import useProjectsPage from './hooks/useProjectsPage';

const COMMENT_TYPES = ['GENERAL', 'QUESTION', 'DECISION', 'WARNING', 'UPDATE'];

const ProjectsPage = ({ mode = 'active', title = 'Project Studio', subtitle = '' }) => {
  const { projectID: routeProjectID } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWorkerEdit = mode === 'worker-edit';
  const canManage = user?.isAdmin === true && !isWorkerEdit;
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
