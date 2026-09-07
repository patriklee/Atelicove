import React, { useState } from 'react';
import {
    Box, Dialog, DialogTitle, DialogContent, DialogActions, Button,
    useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../Components/AuthContext';
import { PageContent, PageHeaderActionsProvider } from '../../shared/components/layout';
import { AppIconButton, icons } from '../../shared/icons';
import AdminDashboard, { AdminGlobalControls } from './dashboard/AdminDashboard';
import useAdminDashboard from './dashboard/useAdminDashboard';
import AdminSidebar from './AdminSidebar';

function AdminContent({ dashboardPage }) {
    const dashboard = useAdminDashboard();
    const globalControls = (
        <AdminGlobalControls
            dashboard={dashboard}
            sx={{ justifyContent: 'flex-end' }}
        />
    );

    return dashboardPage ? (
        <AdminDashboard dashboard={dashboard} headerActions={globalControls} />
    ) : (
        <PageHeaderActionsProvider actions={globalControls}>
            <Outlet />
        </PageHeaderActionsProvider>
    );
}

const AdminHomePage = () => {
    const [open, setOpen] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const location = useLocation();
    const { logout, user } = useAuth();
    const theme = useTheme();
    const mobile = useMediaQuery(theme.breakpoints.down('sm'));
    const showGlobalControls = !location.pathname.startsWith('/admin/settings');

    const handleLogoutClick = () => {
        setOpen(true);
    };

    const handleConfirmLogout = () => {
        setOpen(false);
        logout();
    };

    const handleCancelLogout = () => {
        setOpen(false);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AdminSidebar
                mobile={mobile}
                mobileOpen={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
                onLogout={handleLogoutClick}
                pathname={location.pathname}
                user={user}
            />

            {mobile && (
                <AppIconButton
                    icon={icons.menu}
                    label="Open navigation"
                    onClick={() => setMobileSidebarOpen(true)}
                    sx={theme => ({
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        left: 12,
                        position: 'fixed',
                        top: 12,
                        zIndex: theme.zIndex.appBar,
                    })}
                />
            )}

			<PageContent sx={{ pt: { xs: 8, sm: 3 } }}>
			    {showGlobalControls
			        ? <AdminContent dashboardPage={location.pathname === '/admin'} />
			        : <Outlet />}
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

export default AdminHomePage;
