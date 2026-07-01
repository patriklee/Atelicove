import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleBackClick = () => {
    if (isAuthenticated() && !user.isAdmin) {
      navigate('/worker');
    } else {
      navigate('/login');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 2
      }}
    >
      <Typography variant="h2" color="error" gutterBottom>
        Unauthorized Access
      </Typography>
      <Typography variant="h5" sx={{ mb: 4 }}>
        You do not have permission to access this page
      </Typography>
      <Button variant="contained" color="primary" onClick={handleBackClick}>
        Return to {isAuthenticated() && !user.isAdmin ? 'Worker Dashboard' : 'Login'}
      </Button>
    </Box>
  );
};

export default UnauthorizedPage;