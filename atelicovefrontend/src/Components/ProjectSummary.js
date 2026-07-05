import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers, normalizeWorker } from '../model';
import TableTitleRow from './TableTitleRow';

const DetailRow = ({ label, value }) => (
  <TableRow>
    <TableCell sx={{ fontWeight: 600, width: 220 }}>{label}</TableCell>
    <TableCell>{value || 'Not set'}</TableCell>
  </TableRow>
);

const workerName = (worker = {}) =>
  `${worker.firstName || worker.workerFName || ''} ${worker.lastName || worker.workerLName || ''}`.trim() ||
  worker.displayName ||
  worker.workerDisplayName ||
  worker.username ||
  worker.workerUser ||
  'Unnamed worker';

const ProjectSummary = () => {
  const { projectID } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch(`/projects/${projectID}`),
      apiFetch(`/projects/${projectID}/documents`).catch(() => []),
    ])
      .then(([projectData, documentData]) => {
        setProject(projectData);
        setDocuments(documentData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectID]);

  if (loading) return <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </Box>
    );
  }

  if (!project) return <Alert severity="warning">Project not found.</Alert>;

  const workOrders = Array.isArray(project.workOrders) ? project.workOrders : [];
  const draftWorkOrders = Array.isArray(project.draftWorkOrders) ? project.draftWorkOrders : [];
  const teams = Array.isArray(project.teams) ? project.teams : [];
  const actionItems = Array.isArray(project.actionItems) ? project.actionItems : [];
  const comments = Array.isArray(project.comments) ? project.comments : [];
  const projectDocuments = documents.length ? documents : (project.documents || []);
  const projectCost = project.projectStatus === 'DRAFT' ? project.estimatedCost : project.actualCost;

  const openWorkOrder = (workOrder) => {
    if (workOrder.status !== 'DRAFT') {
      navigate(`/admin/workorders/${workOrder.workOrderID}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        {project.projectName || `Project #${project.projectID}`}
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableTitleRow title="Project Summary" colSpan={2} />
          </TableHead>
          <TableBody>
            <DetailRow label="Status" value={project.projectStatus?.replaceAll('_', ' ')} />
            <DetailRow label="Description" value={project.description} />
            <DetailRow label="Budget" value={formatMoney(project.budget)} />
            <DetailRow label={project.projectStatus === 'DRAFT' ? 'Estimated Cost' : 'Actual Cost'} value={formatMoney(projectCost)} />
            <DetailRow label="Budget Difference" value={formatMoney(project.budgetDifference)} />
            <DetailRow label="Activated" value={formatDateTime(project.activatedAt)} />
            <DetailRow label="Completed" value={formatDateTime(project.completedAt)} />
            <DetailRow label="Archived" value={project.archived ? formatDateTime(project.archivedAt) : 'No'} />
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableTitleRow title="Teams" colSpan={2} />
            <TableRow>
              <TableCell>Team</TableCell>
              <TableCell>Workers</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map(team => (
              <TableRow key={team.teamID}>
                <TableCell>{team.teamName || `Team #${team.teamID}`}</TableCell>
                <TableCell>{(team.workers || []).map(worker => workerName(normalizeWorker(worker))).join(', ') || 'No workers'}</TableCell>
              </TableRow>
            ))}
            {!teams.length && (
              <TableRow>
                <TableCell colSpan={2}>No teams are associated with this project.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableTitleRow title="Work Orders" colSpan={6} />
            <TableRow>
              <TableCell>Work Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Assigned Workers</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell>Start</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workOrders.map(workOrder => (
              <TableRow key={workOrder.workOrderID}>
                <TableCell>
                  <Button size="small" onClick={() => openWorkOrder(workOrder)}>
                    #{workOrder.workOrderID}
                  </Button>
                </TableCell>
                <TableCell><Chip size="small" label={workOrder.status?.replaceAll('_', ' ') || 'Not set'} /></TableCell>
                <TableCell>{workOrder.company?.companyName || 'No company'}</TableCell>
                <TableCell>{getWorkOrderWorkers(workOrder).map(workerName).join(', ') || 'Unassigned'}</TableCell>
                <TableCell align="right">{formatMoney(getWorkOrderActualPrice(workOrder))}</TableCell>
                <TableCell>{formatDateTime(workOrder.startDateTime)}</TableCell>
              </TableRow>
            ))}
            {!workOrders.length && (
              <TableRow>
                <TableCell colSpan={6}>No work orders are associated with this project.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableTitleRow title="Draft Work Orders" colSpan={5} />
            <TableRow>
              <TableCell>Draft</TableCell>
              <TableCell>Source Work Order</TableCell>
              <TableCell>Planned Company</TableCell>
              <TableCell>Planned Team</TableCell>
              <TableCell align="right">Estimated Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {draftWorkOrders.map(draft => (
              <TableRow key={draft.draftWorkOrderID || draft.workOrderID}>
                <TableCell>#{draft.workOrderID}</TableCell>
                <TableCell>{draft.sourceWorkOrderID ? `#${draft.sourceWorkOrderID}` : 'New planning item'}</TableCell>
                <TableCell>{draft.company?.companyName || draft.plannedCompanyName || 'No company'}</TableCell>
                <TableCell>{draft.plannedTeamName || 'No team'}</TableCell>
                <TableCell align="right">{formatMoney(getWorkOrderActualPrice(draft))}</TableCell>
              </TableRow>
            ))}
            {!draftWorkOrders.length && (
              <TableRow>
                <TableCell colSpan={5}>No draft work orders are associated with this project.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableTitleRow title="Documents" colSpan={3} />
            <TableRow>
              <TableCell>Document</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Uploaded</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projectDocuments.map((document, index) => (
              <TableRow key={document.documentID || document.fileNo || document.fileName || index}>
                <TableCell>{document.originalFileName || document.fileName || `Document #${document.documentID || document.fileNo}`}</TableCell>
                <TableCell>{document.uploadedBy ? workerName(normalizeWorker(document.uploadedBy)) : 'Not set'}</TableCell>
                <TableCell>{formatDateTime(document.uploadedAt || document.createdAt)}</TableCell>
              </TableRow>
            ))}
            {!projectDocuments.length && (
              <TableRow>
                <TableCell colSpan={3}>No documents are attached to this project.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={4}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableTitleRow title="Action Items" colSpan={3} />
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Action Item</TableCell>
                <TableCell>Assigned To</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {actionItems.map(item => (
                <TableRow key={item.actionItemID}>
                  <TableCell><Chip size="small" label={item.completed ? 'Done' : 'Open'} /></TableCell>
                  <TableCell>{item.itemText}</TableCell>
                  <TableCell>{item.assignedWorker ? workerName(normalizeWorker(item.assignedWorker)) : item.assignedTeam?.teamName || 'General'}</TableCell>
                </TableRow>
              ))}
              {!actionItems.length && (
                <TableRow>
                  <TableCell colSpan={3}>No action items are associated with this project.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableTitleRow title="Comments" colSpan={3} />
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Added</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comments.map(comment => (
                <TableRow key={comment.projectCommentID}>
                  <TableCell>{comment.commentType?.replaceAll('_', ' ') || 'Not set'}</TableCell>
                  <TableCell>{comment.commentText}</TableCell>
                  <TableCell>{formatDateTime(comment.createdAt)}</TableCell>
                </TableRow>
              ))}
              {!comments.length && (
                <TableRow>
                  <TableCell colSpan={3}>No comments have been added.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
};

export default ProjectSummary;
