import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';

const menuItems = [
  { label: 'My Assignments', path: '/worker/my-assignments' },
  { label: 'View Assigned Work', path: '/worker/assigned' },
  { label: 'Billing', path: '/worker/billing' },
  { label: 'Settings', path: '/worker/settings' },
  { label: 'Logout', path: '/worker/logout' },
];

const WorkerNavigation = ({ pathname, user, onNavigate, onLogout }) => (
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
      onClick={() => onNavigate('/worker')}
    >
      Atelicove
    </Typography>

    {user && (
      <Typography variant="subtitle1" sx={{ marginBottom: 2 }}>
        Welcome, {user.firstName}. What are we creating today?
      </Typography>
    )}

    <List>
      {menuItems.map(item => {
        const isActive = pathname === item.path;
        const isLogout = item.label === 'Logout';

        return (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => (isLogout ? onLogout() : onNavigate(item.path))}
              sx={{
                color: isActive ? 'navigation.text' : 'navigation.muted',
                backgroundColor: isActive ? 'navigation.active' : 'transparent',
                '&:hover': {
                  backgroundColor: isActive ? 'navigation.active' : 'navigation.hover',
                  color: 'navigation.text',
                },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  </Drawer>
);

export default WorkerNavigation;
