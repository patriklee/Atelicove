import React, { useState } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button
} from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../Components/AuthContext';

const WorkerHomePage = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { label: 'My Assignments', path: '/worker/my-assignments' },
    { label: 'View Assigned Work', path: '/worker/assigned' },
    { label: 'Billing', path: '/worker/billing' },
    { label: 'Settings', path: '/worker/settings' },
    { label: 'Logout', path: '/worker/logout' },
  ];

  const handleLogoutClick = () => {
    setOpen(true);
  };

  const handleConfirmLogout = () => {
    setOpen(false);
    logout(); // Using the logout function from AuthContext
  };

  const handleCancelLogout = () => {
    setOpen(false);
  };

  const handleItemClick = (path, label) => {
    if (label === 'Logout') {
      handleLogoutClick();
    } else {
      navigate(path);
    }
  };
  
  const handleTitleClick = () => {
    navigate('/worker');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
            backgroundColor: 'navigation.background',
            borderRight: '1px solid',
            borderColor: 'navigation.border',
            color: 'navigation.text',
            textAlign: 'center',
            padding: '20px 0',
          },
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold', 
            marginBottom: 2,
            cursor: 'pointer',
            '&:hover': {
              color: 'navigation.muted',
            },
          }}
          onClick={handleTitleClick}
        >
          Atelicove
        </Typography>
        
        {user && (
          <Typography variant="subtitle1" sx={{ marginBottom: 2 }}>
            Welcome, {user.firstName}. What are we creating today?
          </Typography>
        )}
        
        <List>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                onClick={() => handleItemClick(item.path, item.label)}
                sx={{
                  color: location.pathname === item.path ? 'navigation.text' : 'navigation.muted',
                  backgroundColor: location.pathname === item.path ? 'navigation.active' : 'transparent',
                  '&:hover': {
                    backgroundColor: location.pathname === item.path
                      ? 'navigation.active'
                      : 'navigation.hover',
                    color: 'navigation.text',
                  },
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, pb: 12 }}>
        <Outlet />
      </Box>

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
