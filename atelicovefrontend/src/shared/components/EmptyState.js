import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function EmptyState({
  title = 'Nothing to show yet',
  message = 'Create or select an item to begin.',
  actionLabel,
  onAction,
}) {
  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: actionLabel ? 2 : 0 }}>
        {message}
      </Typography>
      {actionLabel && typeof onAction === 'function' && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
