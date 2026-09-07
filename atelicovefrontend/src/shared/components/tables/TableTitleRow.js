import React from 'react';
import { TableCell, TableRow, Typography } from '@mui/material';

const TableTitleRow = ({ title, colSpan }) => (
  <TableRow>
    <TableCell
      colSpan={colSpan}
      align="left"
      sx={{
        bgcolor: 'background.subtle',
        left: 'auto',
        zIndex: 3,
        '&.MuiTableCell-stickyHeader': {
          left: 'auto',
        },
      }}
    >
      <Typography variant="h6" component="h2">{title}</Typography>
    </TableCell>
  </TableRow>
);

export default TableTitleRow;
