import React, { useEffect, useState } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { TableNavigationButton } from '../../shared/components/navigation';
import { EntityEmptyState } from '../../shared/components/tables';
import { AppAlert, AppTableSortLabel } from '../../shared/icons';

const ActiveCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [orderBy, setOrderBy] = useState('companyName');
  const [order, setOrder] = useState('asc');
  const [error, setError] = useState('');

  useEffect(() => {
    companyService.getAllActive()
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
    <PageContainer>
      <PageHeader title="Companies" subtitle="Browse currently active companies." />
      <PageSections>
      {error && <AppAlert severity="error">{error}</AppAlert>}

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
                  <AppTableSortLabel active={orderBy === column} direction={orderBy === column ? order : 'asc'} onClick={() => handleSort(column)}>
                    {label}
                  </AppTableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCompanies.map(company => (
              <TableRow key={company.companyID} hover>
                <TableCell>
                  <TableNavigationButton onClick={() => navigate(`/admin/companies/${company.companyID}`)}>
                    {company.companyName}
                  </TableNavigationButton>
                </TableCell>
                <TableCell>{company.companyAddress || 'Not set'}</TableCell>
                <TableCell>{company.companyPhone || 'Not set'}</TableCell>
                <TableCell>{company.companyEmail || 'Not set'}</TableCell>
              </TableRow>
            ))}
            {!sortedCompanies.length && (
              <EntityEmptyState message="No companies found." colSpan={4} />
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </PageSections>
    </PageContainer>
  );
};

export default ActiveCompanies;
