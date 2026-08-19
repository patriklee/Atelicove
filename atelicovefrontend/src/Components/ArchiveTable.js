import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
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
import { PageContainer, PageHeader, PageSections } from '../shared/components/layout';
import { formatDateTime, formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers, normalizeWorker } from '../model';
import { AppAlert } from '../shared/icons';

const archiveConfig = {
  projects: {
    title: 'Projects',
    subtitle: 'Browse archived projects and their snapshots.',
    endpoint: '/projects/archived',
    restorePath: item => `/projects/${item.projectID}/restore`,
    canDelete: false,
    key: item => item.projectID,
    empty: 'No archived projects found.',
    columns: [
      { label: 'Project', value: item => item.projectName || `Project #${item.projectID}` },
      { label: 'Status', value: item => item.projectStatus?.replaceAll('_', ' ') || 'Not set' },
      { label: 'Budget', value: item => item.budget == null ? 'Not set' : formatMoney(item.budget) },
      { label: 'Actual Cost', value: item => formatMoney(item.actualCost) },
      { label: 'Snapshots', value: item => (item.snapshots?.length ? (
        <Stack spacing={0.5}>
          {item.snapshots.map(snapshot => (
            <Typography key={snapshot.projectSnapshotID} variant="body2">
              {snapshot.snapshotName || `Snapshot #${snapshot.projectSnapshotID}`} - {formatDateTime(snapshot.createdAt)}
            </Typography>
          ))}
        </Stack>
      ) : 'None') },
      { label: 'Created', value: item => formatDateTime(item.createdAt) },
      { label: 'Archived', value: item => formatDateTime(item.archivedAt) },
    ],
  },
  workorders: {
    title: 'Work Orders',
    subtitle: 'Browse archived work orders.',
    endpoint: '/workorders/archived',
    restorePath: item => `/workorders/${item.workOrderID}/restore`,
    canDelete: false,
    key: item => item.workOrderID,
    empty: 'No archived work orders found.',
    columns: [
      { label: 'Work Order', value: (item, navigate) => (
        <Button size="small" onClick={() => navigate(`/admin/workorders/${item.workOrderID}`)}>
          #{item.workOrderID}
        </Button>
      ) },
      { label: 'Company', value: item => item.company?.companyName || 'No company' },
      { label: 'Assigned Workers', value: item => {
        const workers = getWorkOrderWorkers(item);
        return workers.map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned';
      } },
      { label: 'Status', value: item => item.status?.replaceAll('_', ' ') || 'Not set' },
      { label: 'Created', value: item => formatDateTime(item.createdAt) },
      { label: 'Last Updated', value: item => formatDateTime(item.lastModifiedAt) },
      { label: 'Completed', value: item => formatDateTime(item.endDateTime) },
      { label: 'Actual Price', value: item => formatMoney(getWorkOrderActualPrice(item)) },
      { label: 'Archived', value: item => formatDateTime(item.archivedAt) },
      { label: 'Files', value: item => item.fileNo ?? '' },
    ],
  },
  companies: {
    title: 'Companies',
    subtitle: 'Browse archived companies.',
    endpoint: '/companies/archived',
    restorePath: item => `/companies/${item.companyID}/restore`,
    canDelete: false,
    key: item => item.companyID,
    empty: 'No archived companies found.',
    columns: [
      { label: 'Company', value: (item, navigate) => (
        <Button size="small" onClick={() => navigate(`/admin/companies/${item.companyID}`)}>
          {item.companyName}
        </Button>
      ) },
      { label: 'Address', value: item => item.companyAddress || 'Not set' },
      { label: 'Phone', value: item => item.companyPhone || 'Not set' },
      { label: 'Email', value: item => item.companyEmail || 'Not set' },
      { label: 'Created', value: item => formatDateTime(item.createdAt) },
      { label: 'Last Updated', value: item => formatDateTime(item.lastModifiedAt) },
      { label: 'Archived', value: item => formatDateTime(item.archivedAt) },
    ],
  },
  workers: {
    title: 'Workers',
    subtitle: 'Browse archived workers.',
    endpoint: '/workers/archived',
    restorePath: item => `/workers/${item.workerID}/restore`,
    canDelete: false,
    key: item => item.workerID,
    empty: 'No archived workers found.',
    columns: [
      { label: 'Worker', value: (item, navigate) => {
        const worker = normalizeWorker(item);
        return (
          <Button size="small" onClick={() => navigate(`/admin/workers/${worker.workerID}`)}>
            {worker.firstName} {worker.lastName}
          </Button>
        );
      } },
      { label: 'Username', value: item => normalizeWorker(item).username },
      { label: 'Email', value: item => normalizeWorker(item).email || 'Not set' },
      { label: 'Role', value: item => normalizeWorker(item).isAdmin ? 'Admin' : 'Worker' },
      { label: 'Created', value: item => formatDateTime(item.createdAt) },
      { label: 'Last Updated', value: item => formatDateTime(item.lastModifiedAt) },
      { label: 'Archived', value: item => formatDateTime(item.archivedAt) },
    ],
  },
};

const ArchiveTable = ({ type }) => {
  const config = archiveConfig[type];
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoringID, setRestoringID] = useState(null);
  const [deletingID, setDeletingID] = useState(null);

  const columns = config.columns;
  const endpoint = config.endpoint;

  const loadItems = useCallback(() => {
    setLoading(true);
    setMessage(null);
    apiFetch(endpoint)
      .then(setItems)
      .catch(error => setMessage({ severity: 'error', text: error.message }))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(loadItems, [loadItems]);

  const restoreItem = async (item) => {
    const id = config.key(item);
    setRestoringID(id);
    setMessage(null);
    try {
      await apiFetch(config.restorePath(item), { method: 'PUT' });
      await loadItems();
      setMessage({ severity: 'success', text: 'Item restored.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setRestoringID(null);
    }
  };

  const deleteItem = async (item) => {
    if (config.canDelete === false) return;
    if (!window.confirm('Permanently delete this archived item? This cannot be undone.')) return;

    const id = config.key(item);
    setDeletingID(id);
    setMessage(null);
    try {
      await apiFetch(config.deletePath(item), { method: 'DELETE' });
      await loadItems();
      setMessage({ severity: 'success', text: 'Archived item permanently deleted.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setDeletingID(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader title={config.title} subtitle={config.subtitle} />
      <PageSections>
      {message && <AppAlert severity={message.severity}>{message.text}</AppAlert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.label}>{column.label}</TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(item => (
              <TableRow key={config.key(item)}>
                {columns.map(column => (
                  <TableCell key={column.label}>{column.value(item, navigate)}</TableCell>
                ))}
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={restoringID === config.key(item) || deletingID === config.key(item)}
                      onClick={() => restoreItem(item)}
                    >
                      Restore
                    </Button>
                    {config.canDelete !== false && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={deletingID === config.key(item) || restoringID === config.key(item)}
                        onClick={() => deleteItem(item)}
                      >
                        Delete
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !items.length && (
              <TableRow>
                <TableCell colSpan={columns.length + 1}>{config.empty}</TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length + 1}>Loading...</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </PageSections>
    </PageContainer>
  );
};

export default ArchiveTable;
