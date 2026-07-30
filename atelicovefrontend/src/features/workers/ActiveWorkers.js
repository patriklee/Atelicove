import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { workerService } from '../../services/workerService';
import { formatDateTime, normalizeWorker } from '../../model';
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Worker</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Browse currently active workers.</Typography>
      {error && <AppAlert severity="error" sx={{ mb: 2 }}>{error}</AppAlert>}

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
    </Box>
  );
};

export default ActiveWorkers;
