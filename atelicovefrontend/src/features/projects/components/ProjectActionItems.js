import React from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { PageSurface } from '../../../shared/components/layout';

export default function ProjectActionItems({
  items,
  text,
  saving,
  canEdit,
  onTextChange,
  onToggle,
  onSubmit,
}) {
  return (
    <PageSurface>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Action Items
      </Typography>

      {items.map(item => (
        <Stack
          key={item.actionItemID}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ py: 1 }}
        >
          <Typography sx={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
            {item.itemText}
          </Typography>
          {canEdit && (
            <Button size="small" onClick={() => onToggle(item, !item.completed)}>
              {item.completed ? 'Reopen' : 'Complete'}
            </Button>
          )}
        </Stack>
      ))}

      {canEdit && (
        <Stack component="form" onSubmit={onSubmit} direction="row" spacing={1} sx={{ mt: 2 }}>
          <TextField
            label="New action item"
            value={text}
            onChange={event => onTextChange(event.target.value)}
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={saving}>Add</Button>
        </Stack>
      )}
    </PageSurface>
  );
}
