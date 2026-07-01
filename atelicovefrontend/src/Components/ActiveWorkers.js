import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, normalizeWorker } from '../model';

const ActiveWorkers = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/workers')
      .then(data => setWorkers(data.map(normalizeWorker)))
      .catch(err => setError(err.message));
  }, []);

  const sortedWorkers = useMemo(
    () => [...workers].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [workers]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Active Workers</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
              <TableRow>
                <TableCell colSpan={5}>No workers found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ActiveWorkers;
