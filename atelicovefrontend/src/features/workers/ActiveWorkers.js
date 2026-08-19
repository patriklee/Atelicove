import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { workerService } from '../../services/workerService';
import { formatDateTime, normalizeWorker } from '../../model';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { EntityEmptyState } from '../../shared/components/tables';
import { AppAlert } from '../../shared/icons';

const ActiveWorkers = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    workerService.getActive()
      .then(data => setWorkers(data.map(normalizeWorker)))
      .catch(err => setError(err.message));
  }, []);

  const sortedWorkers = useMemo(
    () => [...workers].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [workers]
  );

  return (
    <PageContainer>
      <PageHeader title="Workers" subtitle="Browse currently active workers." />
      <PageSections>
      {error && <AppAlert severity="error">{error}</AppAlert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Last Login</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedWorkers.map(worker => (
              <TableRow key={worker.workerID}>
                <TableCell>
                  <Button size="small" onClick={() => navigate(`/admin/workers/${worker.workerID}`)}>
                    {worker.firstName} {worker.lastName}
                  </Button>
                </TableCell>
                <TableCell>{worker.username}</TableCell>
                <TableCell>{worker.email}</TableCell>
                <TableCell>{worker.isAdmin ? 'Admin' : 'Worker'}</TableCell>
                <TableCell>{formatDateTime(worker.lastLoginAt)}</TableCell>
              </TableRow>
            ))}
            {!sortedWorkers.length && (
              <EntityEmptyState message="No workers found." colSpan={5} />
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </PageSections>
    </PageContainer>
  );
};

export default ActiveWorkers;
