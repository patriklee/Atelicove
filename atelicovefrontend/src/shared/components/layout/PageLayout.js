import React, { createContext, useContext } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

export const PAGE_MAX_WIDTH = 1500;
export const PAGE_SECTION_SPACING = 3;
export const PAGE_GUTTERS = { xs: 2, sm: 3 };
export const PAGE_BOTTOM_SPACING = 12;
export const SURFACE_PADDING = { xs: 2, md: 3 };

const PageHeaderActionsContext = createContext(null);
const mergeSx = (base, sx) => [base, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])];

export const PageHeaderActionsProvider = ({ actions, children }) => (
  <PageHeaderActionsContext.Provider value={actions}>
    {children}
  </PageHeaderActionsContext.Provider>
);

export const PageContainer = ({ children, sx, ...props }) => (
  <Box
    sx={mergeSx({ width: '100%', maxWidth: PAGE_MAX_WIDTH, mx: 'auto' }, sx)}
    {...props}
  >
    {children}
  </Box>
);

export const PageContent = ({ children, sx, ...props }) => (
  <Box
    component="main"
    sx={mergeSx(
      {
        flexGrow: 1,
        minWidth: 0,
        overflowX: 'hidden',
        p: PAGE_GUTTERS,
        pb: PAGE_BOTTOM_SPACING,
      },
      sx,
    )}
    {...props}
  >
    {children}
  </Box>
);

export const PageHeader = ({ title, subtitle, actions: actionsProp, context, sx }) => {
  const sharedActions = useContext(PageHeaderActionsContext);
  const actions = actionsProp ?? sharedActions;

  return (
    <Stack
      direction={{ xs: 'column', md: actions ? 'row' : 'column' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', md: actions ? 'center' : 'stretch' }}
      spacing={2}
      sx={mergeSx({ mb: PAGE_SECTION_SPACING }, sx)}
    >
      <Box>
        {context}
        <Typography variant="h4" component="h1" color="text.primary">{title}</Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
        )}
      </Box>
      {actions}
    </Stack>
  );
};

export const PageSections = ({ children, spacing = PAGE_SECTION_SPACING, sx, ...props }) => (
  <Stack spacing={spacing} sx={sx} {...props}>{children}</Stack>
);

export const PageSurface = ({ children, sx, ...props }) => (
  <Paper sx={mergeSx({ p: SURFACE_PADDING }, sx)} {...props}>
    {children}
  </Paper>
);
