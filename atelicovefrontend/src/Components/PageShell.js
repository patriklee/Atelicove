import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useAuth } from './AuthContext';

export default function PageShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7f4ef', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>{title}</Typography>
            {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
            <Typography variant="caption" color="text.secondary">{location.pathname}</Typography>
          </Box>
          {user && <Button component={Link} to="/login" onClick={logout}>Logout</Button>}
        </Stack>
      </Paper>
      {children || <Outlet />}
    </Box>
  );
}
