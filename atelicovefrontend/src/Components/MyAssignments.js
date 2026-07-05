import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
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
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers, normalizeWorker } from '../model';
import { useAuth } from './AuthContext';

const formatStatus = (status = '') => status.replaceAll('_', ' ');

const MyAssignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/workorders'),
      apiFetch('/projects/all-with-archived'),
    ])
      .then(([workOrderData, projectData]) => {
        setWorkOrders(workOrderData.filter(order =>
          !order.archived && getWorkOrderWorkers(order).some(worker => worker.workerID === user?.workerID)
        ));
        setProjects(projectData.filter(project => !project.archived));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const workerIsOnProject = (project) => {
    const currentWorkerID = Number(user?.workerID);
    if (!currentWorkerID) return false;

    const projectTeamWorkers = (project.teams || [])
      .flatMap(team => team.workers || [])
      .map(normalizeWorker);

    return projectTeamWorkers.some(worker => Number(worker.workerID) === currentWorkerID);
  };

  const activeProjects = projects.filter(project => project.projectStatus === 'ACTIVE' && workerIsOnProject(project));

  const openWorkOrder = (workOrderID) => {
    navigate(user?.isAdmin ? `/admin/my-assignments/${workOrderID}` : `/worker/my-assignments/${workOrderID}`);
  };

  const openProject = (projectID) => {
    navigate(user?.isAdmin ? '/admin/projects/active' : `/worker/projects/${projectID}/edit`, {
      state: user?.isAdmin ? { projectStudioEditProjectID: projectID } : undefined,
    });
  };

  if (loading) return <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>My Assignments</Typography>
      <Typography color="text.secondary">Browse my current assigned projects and work orders</Typography>
      <ButtonGroup variant="outlined" aria-label="My Assignments view" sx={{ mt: 1, mb: 3 }}>
        <Button variant={view === 'projects' ? 'contained' : 'outlined'} onClick={() => setView('projects')}>
          Projects
        </Button>
        <Button variant={view === 'workOrders' ? 'contained' : 'outlined'} onClick={() => setView('workOrders')}>
          Work Orders
        </Button>
      </ButtonGroup>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {view === 'projects' && !activeProjects.length && <Alert severity="info">No active projects are assigned to you.</Alert>}
      {view === 'workOrders' && !workOrders.length && <Alert severity="info">No work orders are assigned to you.</Alert>}

      {view === 'projects' && (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>Work Orders</TableCell>
              <TableCell>Action Items</TableCell>
              <TableCell>Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeProjects.map(project => (
              <TableRow key={project.projectID}>
                <TableCell>
                  <Button size="small" onClick={() => openProject(project.projectID)} sx={{ justifyContent: 'flex-start', p: 0, textAlign: 'left' }}>
                    {project.projectName || `Project #${project.projectID}`}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {project.description || 'No description'}
                  </Typography>
                </TableCell>
                <TableCell><Chip label={formatStatus(project.projectStatus)} size="small" /></TableCell>
                <TableCell>{project.budget === null || project.budget === undefined ? '' : `$${Number(project.budget).toLocaleString()}`}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                    {(project.teams || []).map(team => (
                      <Chip key={team.teamID} size="small" label={team.teamName || `Team #${team.teamID}`} />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>{(project.workOrders || []).length || project.workOrderCount || 0}</TableCell>
                <TableCell>{(project.actionItems || []).filter(item => item.completed).length}/{(project.actionItems || []).length}</TableCell>
                <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {view === 'workOrders' && (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Work Order ID</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Assigned Workers</TableCell>
              <TableCell>Documents</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workOrders.map(order => (
              <TableRow key={order.workOrderID}>
                <TableCell>
                  <Button size="small" onClick={() => openWorkOrder(order.workOrderID)}>
                    {order.workOrderID}
                  </Button>
                </TableCell>
                <TableCell>{order.company?.companyName || 'No company'}</TableCell>
                <TableCell><Chip label={formatStatus(order.status)} size="small" /></TableCell>
                <TableCell>{formatDateTime(order.startDateTime)}</TableCell>
                <TableCell>{order.items?.length ?? 0}</TableCell>
                <TableCell>{getWorkOrderWorkers(order).length}</TableCell>
                <TableCell>{order.fileNo ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}
    </Box>
  );
};

export default MyAssignments;
