import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const ActiveCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [orderBy, setOrderBy] = useState('companyName');
  const [order, setOrder] = useState('asc');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/companies/all')
      .then(setCompanies)
      .catch(err => setError(err.message));
  }, []);

  const handleSort = (column) => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    const aValue = a[orderBy] || '';
    const bValue = b[orderBy] || '';
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Companies</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Browse currently active companies</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {[
                ['companyName', 'Company'],
                ['companyAddress', 'Address'],
                ['companyPhone', 'Phone'],
                ['companyEmail', 'Email'],
              ].map(([column, label]) => (
                <TableCell key={column}>
                  <TableSortLabel active={orderBy === column} direction={orderBy === column ? order : 'asc'} onClick={() => handleSort(column)}>
                    {label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCompanies.map(company => (
              <TableRow key={company.companyID}>
                <TableCell>
                  <Button size="small" onClick={() => navigate(`/admin/companies/${company.companyID}`)}>
                    {company.companyName}
                  </Button>
                </TableCell>
                <TableCell>{company.companyAddress || 'Not set'}</TableCell>
                <TableCell>{company.companyPhone || 'Not set'}</TableCell>
                <TableCell>{company.companyEmail || 'Not set'}</TableCell>
              </TableRow>
            ))}
            {!sortedCompanies.length && (
              <TableRow>
                <TableCell colSpan={4}>No companies found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ActiveCompanies;
