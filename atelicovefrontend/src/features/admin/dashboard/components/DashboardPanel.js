import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { PageSurface } from '../../../../shared/components/layout';
import { AppIcon } from '../../../../shared/icons';

const mergeSx = (base, sx) => [base, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])];

export const DashboardPanel = ({ children, sx, ...props }) => (
  <PageSurface
    sx={mergeSx({
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      boxShadow: theme => theme.customShadows.soft,
      bgcolor: 'background.paper',
    }, sx)}
    {...props}
  >
    {children}
  </PageSurface>
);

export const DashboardSectionHeading = ({
  icon,
  iconColor = 'primary.main',
  title,
  subtitle,
  action,
  sx,
}) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="flex-start"
    spacing={2}
    sx={mergeSx({ mb: 2 }, sx)}
  >
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        {icon && (
          <Box component="span" sx={{ color: iconColor, display: 'inline-flex' }}>
            <AppIcon icon={icon} />
          </Box>
        )}
        <Typography variant="h6" component="h2">{title}</Typography>
      </Stack>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Stack>
);
