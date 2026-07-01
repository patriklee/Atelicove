import React from 'react';
import { Alert, Box, Typography } from '@mui/material';

const DraftPage = ({ title, subtitle }) => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{title}</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>{subtitle}</Typography>
    <Alert severity="info">This project area is drafted for a future workflow.</Alert>
  </Box>
);

export default DraftPage;
