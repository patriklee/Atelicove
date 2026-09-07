import React from 'react';
import { TableCell, TableRow } from '@mui/material';

const EntityEmptyState = ({ message, colSpan, sx, ...props }) => (
  <TableRow>
    <TableCell
      colSpan={colSpan}
      aria-live="polite"
      sx={[
        { color: 'text.secondary', py: 3, textAlign: 'center' },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {message}
    </TableCell>
  </TableRow>
);

export default EntityEmptyState;
