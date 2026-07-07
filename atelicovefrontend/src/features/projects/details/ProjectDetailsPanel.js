import React from 'react';
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

const ProjectDetailsPanel = ({
  selectedProject,
  isStudioEditView = false,
  plannedTeamsForProject,
  formatMoney,
  getWorkOrderWorkers,
  workerName,
  workOrderCost,
  normalizeWorker,
  formatDateTime,
}) => {
  if (!selectedProject) return null;

  const plannedTeams = plannedTeamsForProject(selectedProject);
  const documents = selectedProject.documents || [];
  const workOrders = [
    ...(selectedProject.workOrders || []),
    ...(selectedProject.draftWorkOrders || []),
  ];
  const actionItems = selectedProject.actionItems || [];
  const comments = selectedProject.comments || [];

  return (
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
          {plannedTeams.map(team => (
            <Chip key={team.teamID} size="small" label={team.teamName || `Team #${team.teamID}`} />
          ))}
          {!plannedTeams.length && <Typography variant="body2">None</Typography>}
        </Stack>

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">Documents</Typography>
        {documents.map((document, index) => (
          <Typography key={document.documentID || document.fileNo || document.fileName || index} variant="body2">
            {document.originalFileName || document.fileName || `Document #${document.documentID || document.fileNo}`}
          </Typography>
        ))}
        {!documents.length && <Typography variant="body2">None</Typography>}

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">Work orders</Typography>
        {workOrders.map(order => (
          <Typography key={order.workOrderID} variant="body2">
            #{order.workOrderID} - {order.status.replaceAll('_', ' ')} - {getWorkOrderWorkers(order).map(workerName).join(', ') || 'Unassigned'} - Cost {formatMoney(workOrderCost(order))}
          </Typography>
        ))}
        {!workOrders.length && <Typography variant="body2">None</Typography>}

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">Action items</Typography>
        {actionItems.map(item => (
          <Stack key={item.actionItemID} direction="row" spacing={1} alignItems="center" sx={{ py: 0.25 }}>
            <Chip size="small" label={item.completed ? 'Done' : 'Open'} />
            <Typography variant="body2" sx={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
              {item.itemText}
            </Typography>
          </Stack>
        ))}
        {!actionItems.length && <Typography variant="body2">None</Typography>}

        <Divider sx={{ my: 1 }} />
        <Typography variant="caption" color="text.secondary">Comments</Typography>
        {comments.slice(-3).map(comment => (
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
        {!comments.length && <Typography variant="body2">None</Typography>}
      </Box>
    </Paper>
  );
};

export default ProjectDetailsPanel;
