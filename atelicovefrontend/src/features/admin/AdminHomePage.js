import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button,
    Collapse
} from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../Components/AuthContext';
import AdminDashboard from './dashboard/AdminDashboard';

const AdminHomePage = () => {
    const [open, setOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({
        projects: false,
        workOrders: false,
        companies: false,
        worker: false,
        archive: false,
    });
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const menuItems = useMemo(() => [
        {
            label: 'Projects',
            key: 'projects',
            children: [
                { label: 'Project Studio', path: '/admin/projects/active' },
                { label: 'My Assignments', path: '/admin/my-assignments' },
            ],
        },
        {
            label: 'Work Orders',
            key: 'workOrders',
            children: [
                { label: 'Active Work Orders', path: '/admin/workorders' },
                { label: 'Manage Work Orders', path: '/admin/manage-workorders' },
            ],
        },
        {
            label: 'Worker',
            key: 'worker',
            children: [
                { label: 'Active Workers', path: '/admin/workers' },
                { label: 'Manage Workers', path: '/admin/manage-workers' },
            ],
        },
        {
            label: 'Companies',
            key: 'companies',
            children: [
                { label: 'Active Companies', path: '/admin/companies' },
                { label: 'Manage Companies', path: '/admin/manage-companies' },
            ],
        },
        { label: 'Documents', path: '/admin/documents' },
        {
            label: 'Archive',
            key: 'archive',
            children: [
                { label: 'Work Orders', path: '/admin/archive/workorders' },
                { label: 'Projects', path: '/admin/archive/projects' },
                { label: 'Companies', path: '/admin/archive/companies' },
                { label: 'Workers', path: '/admin/archive/workers' },
            ],
        },
        { label: 'Settings', path: '/admin/settings' },
        { label: 'Logout', path: '/admin/logout' }
    ], []);

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

    const closedMenus = useCallback(() => ({
        projects: false,
        workOrders: false,
        companies: false,
        worker: false,
        archive: false,
    }), []);

    const getParentMenuKey = useCallback((path) => (
        menuItems.find(item => item.children?.some(child => path === child.path || path.startsWith(`${child.path}/`)))?.key
    ), [menuItems]);

    const openOnlyMenu = useCallback((key) => {
        setOpenMenus({ ...closedMenus(), ...(key ? { [key]: true } : {}) });
    }, [closedMenus]);

    const handleItemClick = (path, label) => {
        if (label === 'Logout') {
            setOpenMenus(closedMenus());
            handleLogoutClick();
        } else {
            navigate(path, { state: { studioResetKey: Date.now() } });
            openOnlyMenu(getParentMenuKey(path));
        }
    };

    const toggleMenu = (key) => {
        setOpenMenus(current => current[key] ? closedMenus() : { ...closedMenus(), [key]: true });
    };

    const isActivePath = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    const handleTitleClick = () => {
        navigate('/admin');
        setOpenMenus(closedMenus());
    };

    useEffect(() => {
        openOnlyMenu(getParentMenuKey(location.pathname));
    }, [getParentMenuKey, location.pathname, openOnlyMenu]);
	
    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: { xs: 104, sm: 250 },
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: { xs: 104, sm: 250 },
                        boxSizing: 'border-box',
                        backgroundColor: '#f4f4f4',
                        textAlign: 'center',
                        padding: { xs: '12px 0', sm: '20px 0' },
                    },
                }}
            >
                <Typography 
                    variant="h5" 
                    sx={{ 
                        fontWeight: 'bold', 
                        marginBottom: 2,
                        fontSize: { xs: '1rem', sm: '1.5rem' },
                        cursor: 'pointer',
                        '&:hover': {
                            color: '#1976d2',
                        },
                    }}
                    onClick={handleTitleClick}
                >
                    Atelicove
                </Typography>
                
                {user && (
                    <Typography variant="subtitle1" sx={{ marginBottom: 2, display: { xs: 'none', sm: 'block' } }}>
                        Welcome, {user.displayName || user.firstName}. What are we creating today?
                    </Typography>
                )}
                
                <List>
                    {menuItems.map((item, index) => {
                        const childActive = item.children?.some(child => isActivePath(child.path));

                        if (item.children) {
                            return (
                                <Box key={item.key}>
                                    <ListItem disablePadding>
                                        <ListItemButton
                                            onClick={() => toggleMenu(item.key)}
                                            sx={{
                                                backgroundColor: childActive ? '#dbeafe' : 'inherit',
                                                borderRadius: '12px',
                                                mx: { xs: 0.5, sm: 1 },
                                                px: { xs: 0.75, sm: 2 },
                                                '&:hover': { backgroundColor: '#e5e7eb' },
                                                '& .MuiListItemText-primary': {
                                                    fontWeight: childActive ? 700 : 500,
                                                    color: '#1f2937',
                                                },
                                            }}
                                        >
                                            <ListItemText primary={`${item.label} ${openMenus[item.key] ? 'v' : '>'}`} />
                                        </ListItemButton>
                                    </ListItem>
                                    <Collapse in={openMenus[item.key]} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {item.children.map(child => (
                                                <ListItem key={child.path} disablePadding>
                                                    <ListItemButton
                                                        onClick={() => handleItemClick(child.path, child.label)}
                                                        sx={{
                                                            backgroundColor: isActivePath(child.path) ? '#153147' : 'inherit',
                                                            color: isActivePath(child.path) ? '#ffffff' : '#1f2937',
                                                            borderRadius: '12px',
                                                            mx: { xs: 0.5, sm: 2 },
                                                            pl: { xs: 1, sm: 4 },
                                                            '&:hover': {
                                                                backgroundColor: isActivePath(child.path) ? '#1f3b63' : '#e5e7eb',
                                                            },
                                                            '& .MuiListItemText-primary': {
                                                                fontWeight: isActivePath(child.path) ? 600 : 400,
                                                                color: isActivePath(child.path) ? '#ffffff' : '#1f2937',
                                                            },
                                                        }}
                                                    >
                                                        <ListItemText primary={child.label} />
                                                    </ListItemButton>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Collapse>
                                </Box>
                            );
                        }

                        return (
                            <ListItem key={index} disablePadding>
                                <ListItemButton
                                    onClick={() => handleItemClick(item.path, item.label)}
                                    sx={{
                                        backgroundColor: isActivePath(item.path) ? '#153147' : 'inherit',
                                        color: isActivePath(item.path) ? '#ffffff' : '#1f2937',
                                        borderRadius: '12px',
                                        mx: { xs: 0.5, sm: 1 },
                                        px: { xs: 0.75, sm: 2 },
                                        '&:hover': {
                                            backgroundColor: isActivePath(item.path) ? '#1f3b63' : '#e5e7eb',
                                        },
                                        '& .MuiListItemText-primary': {
                                            fontWeight: isActivePath(item.path) ? 600 : 400,
                                            color: isActivePath(item.path) ? '#ffffff' : '#1f2937',
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

			<Box component="main" sx={{ flexGrow: 1, minWidth: 0, overflowX: 'hidden', p: { xs: 1.5, sm: 3 }, pb: 12 }}>
			    {location.pathname === '/admin' && (
			        <AdminDashboard />
			    )}

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

export default AdminHomePage;
