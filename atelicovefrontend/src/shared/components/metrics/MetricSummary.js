import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { AppIcon } from '../../icons';

const cardSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: theme => theme.customShadows.soft,
  bgcolor: 'background.paper',
  p: 2.5,
  height: '100%',
};

const MetricSummary = ({ metrics, ariaLabel = 'Page summary' }) => (
  <Box
    role="region"
    aria-label={ariaLabel}
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))',
      gap: 2,
    }}
  >
    {metrics.map(metric => (
      <Paper key={metric.label} sx={cardSx}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
            <Typography variant="h4" sx={{ mt: 0.5, color: 'text.primary', wordBreak: 'break-word' }}>
              {metric.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">{metric.detail}</Typography>
          </Box>
          {metric.icon && (
            <Box sx={{ p: 1, borderRadius: 2, color: 'brand.secondary', bgcolor: 'brand.soft', display: 'flex' }}>
              <AppIcon icon={metric.icon} size={22} />
            </Box>
          )}
        </Stack>
      </Paper>
    ))}
  </Box>
);

export default MetricSummary;
