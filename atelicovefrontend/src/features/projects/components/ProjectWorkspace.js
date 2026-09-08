import React from 'react';
import { Button, Stack } from '@mui/material';
import { WorkOrderDocuments } from '../../documents';
import ProjectActionItems from './ProjectActionItems';
import ProjectComments from './ProjectComments';
import ProjectWorkOrders from './ProjectWorkOrders';

const COMMENT_TYPES = ['GENERAL', 'QUESTION', 'DECISION', 'WARNING', 'UPDATE'];

const ProjectWorkspace = ({
  project,
  canManage,
  workOrderForm,
  workOrders,
  teams,
  companies,
  saving,
  commentText,
  commentType,
  actionItemText,
  onWorkOrderFormChange,
  onOpenWorkOrder,
  onRemoveWorkOrder,
  onAttachWorkOrder,
  onCommentTextChange,
  onCommentTypeChange,
  onAddComment,
  onActionItemTextChange,
  onToggleActionItem,
  onAddActionItem,
  onRunProjectAction,
}) => {
  const projectOpenForEditing = !project.archived && project.projectStatus !== 'COMPLETE';

  return (
    <Stack spacing={4}>
      <ProjectWorkOrders
        project={project}
        canManage={canManage}
        form={workOrderForm}
        workOrders={workOrders}
        teams={teams}
        companies={companies}
        saving={saving}
        onFormChange={onWorkOrderFormChange}
        onOpen={onOpenWorkOrder}
        onRemove={onRemoveWorkOrder}
        onSubmit={onAttachWorkOrder}
      />

      <ProjectComments
        comments={project.comments || []}
        commentText={commentText}
        commentType={commentType}
        commentTypes={COMMENT_TYPES}
        saving={saving}
        canEdit={projectOpenForEditing}
        onTextChange={onCommentTextChange}
        onTypeChange={onCommentTypeChange}
        onSubmit={onAddComment}
      />

      <ProjectActionItems
        items={project.actionItems || []}
        text={actionItemText}
        saving={saving}
        canEdit={projectOpenForEditing}
        onTextChange={onActionItemTextChange}
        onToggle={onToggleActionItem}
        onSubmit={onAddActionItem}
      />

      <WorkOrderDocuments
        basePath={`/projects/${project.projectID}/documents`}
        canManage={!project.archived}
        title="Project Documents"
        emptyMessage="No documents are attached to this project."
      />

      {canManage && (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {project.projectStatus === 'OPEN' && (
            <Button onClick={() => onRunProjectAction(`/projects/${project.projectID}/submit`, { method: 'PUT' }, 'Project submitted for review.')}>
              Submit for Review
            </Button>
          )}
          {project.projectStatus === 'IN_REVIEW' && (
            <Button onClick={() => onRunProjectAction(`/projects/${project.projectID}/reject`, { method: 'PUT' }, 'Project returned to open status.')}>
              Reject
            </Button>
          )}
          {project.projectStatus === 'IN_REVIEW' && (
            <Button variant="contained" onClick={() => onRunProjectAction(`/projects/${project.projectID}/complete`, { method: 'PUT' }, 'Project completed.')}>
              Complete
            </Button>
          )}
          {project.projectStatus === 'COMPLETE' && (
            <Button color="warning" onClick={() => onRunProjectAction(`/projects/${project.projectID}`, { method: 'DELETE' }, 'Project archived.')}>
              Archive
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default ProjectWorkspace;
