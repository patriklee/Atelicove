import React from 'react';
import { Paper, Typography } from '@mui/material';

export default function PlaceholderPage({ title = 'Atelicove Page', note = 'This placeholder keeps the refactored route compiling while the full page component is restored.' }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>{note}</Typography>
    </Paper>
  );
}
