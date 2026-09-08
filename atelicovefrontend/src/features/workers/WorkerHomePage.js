import React, { useState } from 'react';
import {
  Box, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../Components/AuthContext';
import { PageContent } from '../../shared/components/layout';
import WorkerNavigation from './components/WorkerNavigation';

const WorkerHomePage = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleConfirmLogout = () => {
    setOpen(false);
    logout();
  };

  const handleCancelLogout = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <WorkerNavigation
        pathname={location.pathname}
        user={user}
        onNavigate={navigate}
        onLogout={() => setOpen(true)}
      />

      <PageContent>
        <Outlet />
      </PageContent>

      <Dialog open={open} onClose={handleCancelLogout}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          Are you sure you want to log out?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLogout} color="primary">No</Button>
          <Button onClick={handleConfirmLogout} color="primary" autoFocus>Yes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerHomePage;
