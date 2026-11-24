import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers } from '../../../model';
import { EntityEmptyState } from '../../../shared/components/tables';

const workerName = worker => `${worker.firstName || worker.workerFName || ''} ${worker.lastName || worker.workerLName || ''}`.trim()
  || worker.displayName || worker.workerDisplayName || worker.username || worker.workerUser || '';
const hasCost = order => ['actualPrice', 'totalPrice', 'price', 'items', 'workOrderItems', 'woItems'].some(key => order[key] != null);
const moneyValue = value => value != null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;

export default function ProjectDetailsDialog({ details, onClose }) {
  const project = details?.project || {};
  const mode = details?.mode;
  let columns = [];
  let rows = [];
  if (mode === 'Budget') {
    const budget = moneyValue(project.budget);
    const orders = project.workOrders;
    const spent = moneyValue(project.actualCost) ?? (Array.isArray(orders) && orders.every(hasCost)
      ? orders.reduce((total, order) => total + getWorkOrderActualPrice(order), 0) : null);
    rows = [['Allocated budget', budget], ['Expenditures', spent], ['Remaining balance', budget != null && spent != null ? budget - spent : null]]
      .filter(([, value]) => value != null).map(([label, value]) => [label, formatMoney(value)]);
  } else if (mode === 'Teams') {
    const teams = project.teams || [];
    const hasMembers = teams.some(team => team.workers?.length);
    columns = ['Team', ...(hasMembers ? ['Members'] : [])];
    rows = teams.map(team => [team.teamName || `Team #${team.teamID}`, ...(hasMembers ? [(team.workers || []).map(worker => [workerName(worker), worker.email || worker.workerEmail, worker.roleTitle].filter(Boolean).join(' · ')).filter(Boolean).join(', ')] : [])]);
  } else if (mode === 'Work Orders') {
    const orders = project.workOrders || [];
    const fields = [
      ['ID', order => order.workOrderID != null ? `#${order.workOrderID}` : ''],
      ['Status', order => (order.status || '').replaceAll('_', ' ')],
      ['Assigned Workers', order => getWorkOrderWorkers(order).map(workerName).filter(Boolean).join(', ')],
      ['Company', order => order.company?.companyName || ''],
      ['Cost', order => hasCost(order) ? formatMoney(getWorkOrderActualPrice(order)) : ''],
    ].filter(([, value]) => orders.some(order => value(order) !== ''));
    columns = fields.map(([label]) => label);
    rows = orders.map(order => fields.map(([, value]) => value(order))).filter(row => row.length);
  }
  return (
    <Dialog open={Boolean(details)} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="project-details-title">
      <DialogTitle id="project-details-title">{project.projectName || `Project #${project.projectID}`} — {mode}</DialogTitle>
      <DialogContent dividers>
        <TableContainer>
          <Table size="small">
            {columns.length > 0 && <TableHead><TableRow>{columns.map(column => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead>}
            <TableBody>
              {rows.map((row, index) => <TableRow key={index}>{row.map((value, cell) => <TableCell key={cell}>{value}</TableCell>)}</TableRow>)}
              {!rows.length && <EntityEmptyState message="No details available." colSpan={columns.length || 2} />}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}
