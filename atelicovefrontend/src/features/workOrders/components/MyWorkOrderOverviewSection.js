import React from 'react';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { formatDateTime } from '../../../model';
import { TableTitleRow } from '../../../shared/components/tables';

const MyWorkOrderOverviewSection = ({ workOrder, workers, project, canOpenProject, onOpenProject }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableTitleRow title="Details" colSpan={2} />
      </TableHead>
      <TableBody>
        <TableRow><TableCell sx={{ fontWeight: 600, width: 220 }}>Status</TableCell><TableCell>{workOrder.status.replaceAll('_', ' ')}</TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 600 }}>Start</TableCell><TableCell>{formatDateTime(workOrder.startDateTime)}</TableCell></TableRow>
        <TableRow><TableCell sx={{ fontWeight: 600 }}>Company</TableCell><TableCell>{workOrder.company?.companyName || 'No company'}</TableCell></TableRow>
        <TableRow>
          <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
          <TableCell>
            {project?.projectID ? (
              canOpenProject ? (
                <Button size="small" onClick={onOpenProject} sx={{ p: 0, minWidth: 0 }}>
                  {project.projectName || `Project #${project.projectID}`}
                </Button>
              ) : (
                project.projectName || `Project #${project.projectID}`
              )
            ) : (
              'No project'
            )}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ fontWeight: 600 }}>Assigned Workers</TableCell>
          <TableCell>{workers.map(worker => `${worker.firstName} ${worker.lastName}`).join(', ')}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

export default MyWorkOrderOverviewSection;
