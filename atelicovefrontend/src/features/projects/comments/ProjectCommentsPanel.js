import React from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';

const ProjectCommentsPanel = ({
  selectedProject,
  isEditorView,
  isStudioEditView,
  commentProjectID,
  commentType,
  commentText,
  commentTypes,
  saving,
  onSubmit,
  onCommentTypeChange,
  onCommentTextChange,
}) => {
  if (!selectedProject) return null;

  const projectID = isEditorView && selectedProject ? selectedProject.projectID : commentProjectID;

  return (
    <Paper component="form" onSubmit={onSubmit} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {isStudioEditView ? 'Draft Project Comments' : 'Project Comment'}
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Comment type</InputLabel>
        <Select value={commentType} label="Comment type" onChange={event => onCommentTypeChange(event.target.value)}>
          <MenuItem value="">Select type</MenuItem>
          {commentTypes.map(type => (
            <MenuItem key={type} value={type}>{type.replaceAll('_', ' ')}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Comment"
        fullWidth
        multiline
        minRows={4}
        margin="normal"
        value={commentText}
        onChange={event => onCommentTextChange(event.target.value)}
      />
      <Button type="submit" variant="contained" disabled={saving || !projectID || !commentType || !commentText.trim()}>
        Add Comment
      </Button>
    </Paper>
  );
};

export default ProjectCommentsPanel;
