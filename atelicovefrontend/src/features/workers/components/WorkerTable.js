import React from 'react';
import {
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { formatDateTime } from '../../../model';
import { PageSurface } from '../../../shared/components/layout';
import TableNavigationButton from '../../../shared/components/navigation/TableNavigationButton';
import { EntityEmptyState, TableTitleRow } from '../../../shared/components/tables';

const WorkerTable = ({ workers, saving, onView, onArchive }) => (
  <Grid item xs={12}>
    <PageSurface>
      <TableContainer sx={{ maxHeight: 360, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableTitleRow title="Workers" colSpan={7} />
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map(worker => (
              <TableRow key={worker.workerID} hover>
                <TableCell>
                  <TableNavigationButton onClick={() => onView(worker)}>{worker.firstName} {worker.lastName}</TableNavigationButton>
                </TableCell>
                <TableCell>{worker.username}</TableCell>
                <TableCell>{worker.email}</TableCell>
                <TableCell>{worker.roleTitle || (worker.isAdmin ? 'Admin' : 'Worker')}</TableCell>
                <TableCell>{formatDateTime(worker.createdAt)}</TableCell>
                <TableCell>{formatDateTime(worker.lastModifiedAt)}</TableCell>
                <TableCell align="right">
                  <Button size="small" color="warning" disabled={saving} onClick={() => onArchive(worker)}>
                    Archive
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!workers.length && <EntityEmptyState message="No workers found." colSpan={7} />}
          </TableBody>
        </Table>
      </TableContainer>
    </PageSurface>
  </Grid>
);

export default WorkerTable;
