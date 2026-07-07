import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

export default function StudioLayout({ title, subtitle, toolbar, children }) {
  return (
    <Stack spacing={3}>
      {(title || subtitle || toolbar) && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
          gap={2}
        >
          <Box>
            {title && <Typography variant="h5" fontWeight={800}>{title}</Typography>}
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
          {toolbar && <Box>{toolbar}</Box>}
        </Stack>
      )}
      {children}
    </Stack>
  );
}
