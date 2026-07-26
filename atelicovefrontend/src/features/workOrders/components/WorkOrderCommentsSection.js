import React from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import TableTitleRow from '../../../Components/TableTitleRow';

const WorkOrderCommentsSection = ({
  comment,
  editing,
  saving,
  onCommentChange,
  onStartEditing,
  onUpdate,
}) => (
  <TableContainer component={Paper} sx={{ mb: 4 }}>
    <Table>
      <TableHead>
        <TableTitleRow title="Comments" colSpan={2} />
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell sx={{ fontWeight: 600, width: 220 }}>Work Notes</TableCell>
          <TableCell>
            <TextField
              value={comment}
              onChange={event => onCommentChange(event.target.value)}
              fullWidth
              multiline
              minRows={4}
              disabled={!editing}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button onClick={onStartEditing}>Edit</Button>
              <Button variant="contained" onClick={onUpdate} disabled={!editing || saving}>Update</Button>
            </Box>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

export default WorkOrderCommentsSection;
