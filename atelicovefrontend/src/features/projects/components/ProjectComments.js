import React from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { formatDateTime } from '../../../model';
import { PageSurface } from '../../../shared/components/layout';
import { AppSelect } from '../../../shared/icons';

export default function ProjectComments({ comments, commentText, commentType, commentTypes, saving, canEdit, onTextChange, onTypeChange, onSubmit }) {
  return <PageSurface><Typography variant="h5" component="h2" sx={{ mb: 2 }}>Comments</Typography>{comments.map(comment => <Box key={comment.projectCommentID} sx={{ mb: 1 }}><Typography variant="body2">{comment.commentText}</Typography><Typography variant="caption" color="text.secondary">{comment.commentType || 'GENERAL'} · {formatDateTime(comment.createdAt)}</Typography></Box>)}{canEdit && <Stack component="form" onSubmit={onSubmit} direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 2 }}><FormControl sx={{ minWidth: 150 }}><InputLabel>Type</InputLabel><AppSelect value={commentType} label="Type" onChange={event => onTypeChange(event.target.value)}>{commentTypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}</AppSelect></FormControl><TextField label="Comment" value={commentText} onChange={event => onTextChange(event.target.value)} fullWidth /><Button type="submit" variant="contained" disabled={saving}>Add</Button></Stack>}</PageSurface>;
}
