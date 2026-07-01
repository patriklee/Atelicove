import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button,
    Collapse
} from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { apiFetch } from '../api';

const AdminHomePage = () => {
    const [open, setOpen] = useState(false);
    const [, setActiveTab] = useState('/admin');
    const [openMenus, setOpenMenus] = useState({
        workOrders: false,
        companies: false,
        worker: false,
        archive: false,
    });
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
	// Added to usestate area
	const[workOrderCount, setWorkOrderCount] = useState(0);
	
    const menuItems = useMemo(() => [
        { label: 'My Assignments', path: '/admin/my-assignments' },
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
        {
            label: 'Archive',
            key: 'archive',
            children: [
                { label: 'Work Orders', path: '/admin/archive/workorders' },
                { label: 'Companies', path: '/admin/archive/companies' },
                { label: 'Workers', path: '/admin/archive/workers' },
            ],
        },
        { label: 'Settings', path: '/admin/settings' },
        { label: 'Logout', path: '/admin/logout' }
    ], []);

    const handleLogoutClick = () => {
        setOpen(true);
        setActiveTab('/admin/logout');
    };

    const handleConfirmLogout = () => {
        setOpen(false);
        logout(); // Using the logout function from AuthContext
    };

    const handleCancelLogout = () => {
        setOpen(false);
        setActiveTab(location.pathname);
    };

    const closedMenus = useCallback(() => ({
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
            navigate(path);
            setActiveTab(path);
            openOnlyMenu(getParentMenuKey(path));
        }
    };

    const toggleMenu = (key) => {
        setOpenMenus(current => current[key] ? closedMenus() : { ...closedMenus(), [key]: true });
    };

    const isActivePath = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    const handleTitleClick = () => {
        navigate('/admin');
        setActiveTab('/admin');
        setOpenMenus(closedMenus());
    };

    useEffect(() => {
        openOnlyMenu(getParentMenuKey(location.pathname));
    }, [getParentMenuKey, location.pathname, openOnlyMenu]);
	
	// Block Test
	useEffect(() => {
	    apiFetch('/workorders/count')
	        .then(setWorkOrderCount)
	        .catch(err => console.error("Error fetching work orders:", err));
	}, []);

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
                        backgroundColor: '#f4f4f4',
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
                            color: '#1976d2',
                        },
                    }}
                    onClick={handleTitleClick}
                >
                    Steve Ball & Associates
                </Typography>
                
                {user && (
                    <Typography variant="subtitle1" sx={{ marginBottom: 2 }}>
                        Welcome, {user.displayName || user.firstName}
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
                                                mx: 1,
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
                                                            mx: 2,
                                                            pl: 4,
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
                                        mx: 1,
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

			<Box component="main" sx={{ flexGrow: 1, p: 3 }}>
			    {location.pathname === '/admin' && (
			        <Box>
			            <Typography variant="h4" sx={{ mb: 3 }}>
			                Admin Dashboard
			            </Typography>
						
						{/* Work order summary */}
			            <Box
							onClick={() => navigate('/admin/workorders')}
			                sx={{
			                    backgroundColor: "#ffffff",
			                    borderRadius: "12px",
			                    padding: "24px",
			                    width: "250px",
			                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
			                    textAlign: "center",
								cursor: "pointer",
								'&:hover': {
								    backgroundColor: "#f3f4f6",
								    transform: "scale(1.02)"
								}
			                }}
			            >
			                <Typography variant="h6">
			                    Total Work Orders
			                </Typography>

			                <Typography variant="h3" sx={{ fontWeight: "bold", color: "#153147" }}>
			                    {workOrderCount}
			                </Typography>
			            </Box>
			        </Box>
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
