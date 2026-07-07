import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
      <CircularProgress size={22} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
