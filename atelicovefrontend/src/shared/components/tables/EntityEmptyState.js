import React from 'react';
import { TableCell, TableRow } from '@mui/material';

const EntityEmptyState = ({ message, colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan}>{message}</TableCell>
  </TableRow>
);

export default EntityEmptyState;
