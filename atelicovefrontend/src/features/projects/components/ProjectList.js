import React from 'react';
import { Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { formatDateTime, formatMoney } from '../../../model';
import { EntityEmptyState } from '../../../shared/components/tables';

export default function ProjectList({ projects, canManage, onEdit, onOpen }) {
  return (
    <TableContainer component={Paper} sx={{ mb: 4 }}>
      <Table>
        <TableHead><TableRow><TableCell>Project</TableCell><TableCell>Status</TableCell><TableCell>Budget</TableCell><TableCell>Teams</TableCell><TableCell>Work Orders</TableCell><TableCell>Updated</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {projects.map(project => (
            <TableRow key={project.projectID}>
              <TableCell>{project.projectName || `Project #${project.projectID}`}</TableCell>
              <TableCell><Chip size="small" label={(project.projectStatus || 'OPEN').replaceAll('_', ' ')} /></TableCell>
              <TableCell>{formatMoney(project.budget)}</TableCell>
              <TableCell>{(project.teams || []).length}</TableCell>
              <TableCell>{(project.workOrders || []).length}</TableCell>
              <TableCell>{formatDateTime(project.lastModifiedAt)}</TableCell>
              <TableCell align="right"><Stack direction="row" spacing={1} justifyContent="flex-end"><Button size="small" onClick={() => onOpen(project)}>View</Button>{canManage && <Button size="small" onClick={() => onEdit(project)}>Edit</Button>}</Stack></TableCell>
            </TableRow>
          ))}
          {!projects.length && <EntityEmptyState message="No active projects found." colSpan={7} />}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
