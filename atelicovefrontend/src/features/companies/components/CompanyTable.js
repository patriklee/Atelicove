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
import { EntityEmptyState, TableTitleRow } from '../../../shared/components/tables';
import { PageSurface } from '../../../shared/components/layout';
import TableNavigationButton from '../../../shared/components/navigation/TableNavigationButton';

const CompanyTable = ({ companies, saving, onView, onArchive }) => (
  <Grid item xs={12}>
    <PageSurface>
      <TableContainer sx={{ maxHeight: 360, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableTitleRow title="Companies" colSpan={5} />
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map(company => (
              <TableRow key={company.companyID} hover>
                <TableCell>
                  <TableNavigationButton onClick={() => onView(company)}>{company.companyName}</TableNavigationButton>
                </TableCell>
                <TableCell>{company.companyAddress || 'Not set'}</TableCell>
                <TableCell>{company.companyPhone || 'Not set'}</TableCell>
                <TableCell>{formatDateTime(company.createdAt)}</TableCell>
                <TableCell align="right">
                  <Button size="small" color="warning" disabled={saving} onClick={() => onArchive(company)}>
                    Archive
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!companies.length && <EntityEmptyState message="No companies found." colSpan={5} />}
          </TableBody>
        </Table>
      </TableContainer>
    </PageSurface>
  </Grid>
);

export default CompanyTable;
