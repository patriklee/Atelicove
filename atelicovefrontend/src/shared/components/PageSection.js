import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

export default function PageSection({ title, subtitle, actions, children, sx }) {
  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5, ...sx }}>
      {(title || subtitle || actions) && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          gap={2}
          sx={{ mb: children ? 2 : 0 }}
        >
          <Box>
            {title && <Typography variant="h6" fontWeight={700}>{title}</Typography>}
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
          {actions && <Box>{actions}</Box>}
        </Stack>
      )}
      {children}
    </Paper>
  );
}
