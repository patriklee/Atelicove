import React from 'react';
import { TableCell, TableRow, Typography } from '@mui/material';

const TableTitleRow = ({ title, colSpan }) => (
  <TableRow>
    <TableCell
      colSpan={colSpan}
      align="left"
      sx={{
        bgcolor: 'grey.50',
        textAlign: 'left',
        left: 'auto',
        zIndex: 3,
        '&.MuiTableCell-stickyHeader': {
          textAlign: 'left',
          left: 'auto',
        },
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'left' }}>
        {title}
      </Typography>
    </TableCell>
  </TableRow>
);

export default TableTitleRow;
