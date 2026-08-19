import React, { createContext, useContext } from 'react';
import {
  Box,
  Stack,
  Typography,
} from '@mui/material';

export const PAGE_MAX_WIDTH = 1500;
export const PAGE_SECTION_SPACING = 3;
export const SURFACE_PADDING = { xs: 2, md: 3 };

const PageHeaderActionsContext = createContext(null);

export const PageHeaderActionsProvider = ({ actions, children }) => (
  <PageHeaderActionsContext.Provider value={actions}>
    {children}
  </PageHeaderActionsContext.Provider>
);

export const PageContainer = ({ children, sx, ...props }) => (
  <Box sx={{ width: '100%', maxWidth: PAGE_MAX_WIDTH, mx: 'auto', ...sx }} {...props}>
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
      sx={{ mb: PAGE_SECTION_SPACING, ...sx }}
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
