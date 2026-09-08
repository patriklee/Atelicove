import React, { useEffect, useState } from 'react';
import {
  Box,
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
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../shared/api';
import { formatDateTime, formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers, normalizeWorker } from '../../model';
import { EntityEmptyState, TableTitleRow } from '../../shared/components/tables';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { BackNavigation, TableNavigationButton } from '../../shared/components/navigation';
import { AppAlert } from '../../shared/icons';

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
      <PageContainer>
        <AppAlert severity="error" sx={{ mb: 2 }}>{error}</AppAlert>
        <BackNavigation fallback="/admin/projects/active" />
      </PageContainer>
    );
  }

  if (!project) return <AppAlert severity="warning">Project not found.</AppAlert>;

  const workOrders = Array.isArray(project.workOrders) ? project.workOrders : [];
  const teams = Array.isArray(project.teams) ? project.teams : [];
  const actionItems = Array.isArray(project.actionItems) ? project.actionItems : [];
  const comments = Array.isArray(project.comments) ? project.comments : [];
  const projectDocuments = documents.length ? documents : (project.documents || []);
  const projectCost = project.projectStatus === 'OPEN' ? project.estimatedCost : project.actualCost;

  const openWorkOrder = (workOrder) => {
    navigate(`/admin/workorders/${workOrder.workOrderID}`);
  };

  return (
    <PageContainer>
      <PageHeader
        context={<BackNavigation fallback="/admin/projects/active" />}
        title={project.projectName || `Project #${project.projectID}`}
      />
      <PageSections>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableTitleRow title="Project Summary" colSpan={2} />
          </TableHead>
          <TableBody>
            <DetailRow label="Status" value={project.projectStatus?.replaceAll('_', ' ')} />
            <DetailRow label="Description" value={project.description} />
            <DetailRow label="Budget" value={formatMoney(project.budget)} />
            <DetailRow label={project.projectStatus === 'OPEN' ? 'Estimated Cost' : 'Actual Cost'} value={formatMoney(projectCost)} />
            <DetailRow label="Budget Difference" value={formatMoney(project.budgetDifference)} />
            <DetailRow label="Activated" value={formatDateTime(project.activatedAt)} />
            <DetailRow label="Completed" value={formatDateTime(project.completedAt)} />
            <DetailRow label="Archived" value={project.archived ? formatDateTime(project.archivedAt) : 'No'} />
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper}>
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
              <EntityEmptyState message="No teams are associated with this project." colSpan={2} />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper}>
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
              <TableRow key={workOrder.workOrderID} hover>
                <TableCell>
                  <TableNavigationButton onClick={() => openWorkOrder(workOrder)}>
                    #{workOrder.workOrderID}
                  </TableNavigationButton>
                </TableCell>
                <TableCell><Chip size="small" label={workOrder.status?.replaceAll('_', ' ') || 'Not set'} /></TableCell>
                <TableCell>{workOrder.company?.companyName || 'No company'}</TableCell>
                <TableCell>{getWorkOrderWorkers(workOrder).map(workerName).join(', ') || 'Unassigned'}</TableCell>
                <TableCell align="right">{formatMoney(getWorkOrderActualPrice(workOrder))}</TableCell>
                <TableCell>{formatDateTime(workOrder.startDateTime)}</TableCell>
              </TableRow>
            ))}
            {!workOrders.length && (
              <EntityEmptyState message="No work orders are associated with this project." colSpan={6} />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper}>
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
              <EntityEmptyState message="No documents are attached to this project." colSpan={3} />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={3}>
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
                <EntityEmptyState message="No action items are associated with this project." colSpan={3} />
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
                <EntityEmptyState message="No comments have been added." colSpan={3} />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
      </PageSections>
    </PageContainer>
  );
};

export default ProjectSummary;
