import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  ButtonBase,
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { AppIcon, ICON_SIZES, icons } from '../../shared/icons';

export const ADMIN_SIDEBAR_WIDTH = 256;

const navigationItems = [
  {
    label: 'Dashboard',
    icon: icons.dashboard,
    path: '/admin',
    exact: true,
  },
  {
    label: 'Projects',
    icon: icons.projects,
    key: 'projects',
    routePrefixes: ['/admin/projects/', '/admin/my-assignments'],
    children: [
      { label: 'Project Studio', icon: icons.projectStudio, path: '/admin/projects/active' },
      { label: 'My Assignments', icon: icons.assignments, path: '/admin/my-assignments' },
    ],
  },
  {
    label: 'Work Orders',
    icon: icons.workOrders,
    key: 'workOrders',
    routePrefixes: ['/admin/workorders', '/admin/manage-workorders'],
    children: [
      { label: 'Active Work Orders', icon: icons.workOrders, path: '/admin/workorders' },
      { label: 'Manage Work Orders', icon: icons.assignments, path: '/admin/manage-workorders' },
    ],
  },
  {
    label: 'Workers',
    icon: icons.workers,
    key: 'workers',
    routePrefixes: ['/admin/workers', '/admin/manage-workers'],
    children: [
      { label: 'Active Workers', icon: icons.workers, path: '/admin/workers' },
      { label: 'Manage Workers', icon: icons.assignments, path: '/admin/manage-workers' },
    ],
  },
  {
    label: 'Companies',
    icon: icons.companies,
    key: 'companies',
    routePrefixes: ['/admin/companies', '/admin/manage-companies'],
    children: [
      { label: 'Active Companies', icon: icons.companies, path: '/admin/companies' },
      { label: 'Manage Companies', icon: icons.assignments, path: '/admin/manage-companies' },
    ],
  },
  {
    label: 'Documents',
    icon: icons.documents,
    path: '/admin/documents',
  },
  {
    label: 'Archive',
    icon: icons.archive,
    key: 'archive',
    routePrefixes: ['/admin/archive/'],
    children: [
      { label: 'Work Orders', icon: icons.workOrders, path: '/admin/archive/workorders' },
      { label: 'Projects', icon: icons.projects, path: '/admin/archive/projects' },
      { label: 'Companies', icon: icons.companies, path: '/admin/archive/companies' },
      { label: 'Workers', icon: icons.workers, path: '/admin/archive/workers' },
    ],
  },
  {
    label: 'Settings',
    icon: icons.settings,
    path: '/admin/settings',
    separated: true,
  },
];

const isPathActive = (pathname, path, exact = false) => (
  exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)
);

const isGroupActive = (pathname, item) => (
  item.routePrefixes.some(prefix => (
    pathname === prefix
    || (prefix.endsWith('/') ? pathname.startsWith(prefix) : pathname.startsWith(`${prefix}/`))
  ))
);

const navButtonStyles = (active, child = false) => theme => ({
  minHeight: child ? 34 : 38,
  mx: 1.25,
  my: 0.25,
  pl: child ? 4.5 : 1.5,
  pr: 1.25,
  borderRadius: 1.5,
  color: active ? theme.palette.primary.dark : theme.palette.text.secondary,
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  transition: theme.transitions.create(['background-color', 'color'], {
    duration: theme.transitions.duration.shortest,
  }),
  '&:hover': {
    backgroundColor: active
      ? alpha(theme.palette.primary.main, 0.14)
      : alpha(theme.palette.text.primary, 0.055),
  },
  '&.Mui-focusVisible': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    boxShadow: `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.42)}`,
  },
  '& .MuiListItemIcon-root': {
    color: 'inherit',
  },
});

function SidebarNavItem({ item, pathname, onNavigate, child = false }) {
  const active = isPathActive(pathname, item.path, item.exact);
  const Icon = item.icon;

  return (
    <ListItem disablePadding>
      <ListItemButton
        aria-current={active ? 'page' : undefined}
        component={RouterLink}
        onClick={onNavigate}
        state={{ studioResetKey: Date.now() }}
        sx={navButtonStyles(active, child)}
        to={item.path}
      >
        <ListItemIcon sx={{ minWidth: child ? 29 : 32 }}>
          <AppIcon icon={Icon} size={child ? ICON_SIZES.compact : ICON_SIZES.standard} />
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontSize: child ? '0.79rem' : '0.84rem',
            fontWeight: active ? 600 : 500,
            lineHeight: 1.25,
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

function SidebarNavGroup({ item, pathname, onNavigate, expanded, onToggle }) {
  const active = isGroupActive(pathname, item);
  const Icon = item.icon;

  return (
    <Box>
      <ListItem disablePadding>
        <ListItemButton
          aria-expanded={expanded}
          onClick={onToggle}
          sx={navButtonStyles(active)}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AppIcon icon={Icon} />
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.84rem',
              fontWeight: active ? 600 : 500,
              lineHeight: 1.25,
            }}
          />
          <AppIcon
            icon={icons.disclosure}
            size={ICON_SIZES.compact}
            style={{
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 140ms ease',
            }}
          />
        </ListItemButton>
      </ListItem>
      <Collapse in={expanded} timeout={160} unmountOnExit>
        <List component="div" disablePadding>
          {item.children.map(childItem => (
            <SidebarNavItem
              child
              item={childItem}
              key={childItem.path}
              onNavigate={onNavigate}
              pathname={pathname}
            />
          ))}
        </List>
      </Collapse>
    </Box>
  );
}

function SidebarBrand({ onNavigate }) {
  return (
    <ButtonBase
      component={RouterLink}
      onClick={onNavigate}
      sx={theme => ({
        alignItems: 'center',
        borderRadius: 1.5,
        display: 'flex',
        justifyContent: 'flex-start',
        mx: 1.25,
        mt: 1.25,
        mb: 1.5,
        px: 1.25,
        py: 0.85,
        textAlign: 'left',
        '&.Mui-focusVisible': {
          boxShadow: `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.42)}`,
        },
      })}
      to="/admin"
    >
      <Box
        sx={theme => ({
          alignItems: 'center',
          backgroundColor: theme.palette.primary.main,
          borderRadius: 1.25,
          color: theme.palette.primary.contrastText,
          display: 'flex',
          height: 30,
          justifyContent: 'center',
          mr: 1.15,
          width: 30,
        })}
      >
        <AppIcon icon={icons.brandMark} size={18} strokeWidth={1.8} />
      </Box>
      <Box>
        <Typography color="text.primary" fontSize="0.94rem" fontWeight={700} lineHeight={1.15}>
          Atelicove
        </Typography>
        <Typography color="text.secondary" fontSize="0.69rem" lineHeight={1.35}>
          Community Edition
        </Typography>
      </Box>
    </ButtonBase>
  );
}

function SidebarAccount({ user, onLogout }) {
  const displayName = user?.displayName
    || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    || user?.username
    || 'Account';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <Box
      sx={theme => ({
        borderTop: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
        p: 1.25,
      })}
    >
      <Box sx={{ alignItems: 'center', display: 'flex', px: 0.75, py: 0.6 }}>
        <Avatar
          sx={theme => ({
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.dark,
            fontSize: '0.72rem',
            fontWeight: 700,
            height: 30,
            mr: 1.1,
            width: 30,
          })}
        >
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.primary" fontSize="0.8rem" fontWeight={600} noWrap>
            {displayName}
          </Typography>
          <Typography color="text.secondary" fontSize="0.69rem" noWrap>
            Administrator
          </Typography>
        </Box>
      </Box>
      <ListItemButton
        onClick={onLogout}
        sx={theme => ({
          borderRadius: 1.5,
          color: theme.palette.text.secondary,
          minHeight: 34,
          mt: 0.35,
          px: 1.25,
          '&:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.055),
            color: theme.palette.text.primary,
          },
          '&.Mui-focusVisible': {
            boxShadow: `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.42)}`,
          },
        })}
      >
        <ListItemIcon sx={{ color: 'inherit', minWidth: 30 }}>
          <AppIcon icon={icons.logout} size={ICON_SIZES.compact} />
        </ListItemIcon>
        <ListItemText
          primary="Log out"
          primaryTypographyProps={{ fontSize: '0.78rem', fontWeight: 500 }}
        />
      </ListItemButton>
    </Box>
  );
}

export default function AdminSidebar({
  mobile,
  mobileOpen,
  onClose,
  onLogout,
  pathname,
  user,
}) {
  const [expandedGroups, setExpandedGroups] = useState(() => (
    Object.fromEntries(
      navigationItems
        .filter(item => item.children)
        .map(item => [item.key, isGroupActive(pathname, item)])
    )
  ));

  useEffect(() => {
    const activeGroup = navigationItems.find(
      item => item.children && isGroupActive(pathname, item)
    );
    if (activeGroup) {
      setExpandedGroups(current => ({ ...current, [activeGroup.key]: true }));
    }
  }, [pathname]);

  const handleNavigate = () => {
    if (mobile) onClose();
  };

  const drawerContent = (
    <Box
      component="nav"
      aria-label="Administrator navigation"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <SidebarBrand onNavigate={handleNavigate} />
      <List
        aria-label="Main navigation"
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 0,
          py: 0.25,
          scrollbarWidth: 'thin',
        }}
      >
        {navigationItems.map(item => (
          <Box key={item.path || item.key} sx={item.separated ? { mt: 1.5 } : undefined}>
            {item.children ? (
              <SidebarNavGroup
                expanded={Boolean(expandedGroups[item.key])}
                item={item}
                onNavigate={handleNavigate}
                onToggle={() => setExpandedGroups(current => ({
                  ...current,
                  [item.key]: !current[item.key],
                }))}
                pathname={pathname}
              />
            ) : (
              <SidebarNavItem
                item={item}
                onNavigate={handleNavigate}
                pathname={pathname}
              />
            )}
          </Box>
        ))}
      </List>
      <SidebarAccount onLogout={onLogout} user={user} />
    </Box>
  );

  return (
    <Drawer
      ModalProps={{ keepMounted: true }}
      onClose={onClose}
      open={mobile ? mobileOpen : true}
      variant={mobile ? 'temporary' : 'permanent'}
      sx={theme => ({
        flexShrink: 0,
        width: mobile ? 0 : ADMIN_SIDEBAR_WIDTH,
        '& .MuiDrawer-paper': {
          backgroundColor: alpha(theme.palette.common.black, 0.018),
          borderRight: `1px solid ${theme.palette.divider}`,
          boxSizing: 'border-box',
          width: mobile ? 'min(86vw, 280px)' : ADMIN_SIDEBAR_WIDTH,
        },
      })}
    >
      {drawerContent}
    </Drawer>
  );
}
