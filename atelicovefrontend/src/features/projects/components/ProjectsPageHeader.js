import React from 'react';
import { Box, Button, ButtonGroup, Stack, Typography } from '@mui/material';

/**
 * Shared header for Draft Studio and Project Studio.
 *
 * This is intentionally small and controlled by props so ProjectsPage can keep
 * owning the edit-leave behavior while the presentation moves out of the large page.
 */
const ProjectsPageHeader = ({
  title,
  subtitle,
  mode,
  studioView,
  onDraftView,
  onEditView,
}) => {
  const showStudioSwitcher = mode === 'studio' || mode === 'active';
  const primaryViewLabel = mode === 'active' ? 'Active' : 'Draft';

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{title}</Typography>
        <Typography color="text.secondary">{subtitle}</Typography>
        {showStudioSwitcher && (
          <ButtonGroup variant="outlined" aria-label={`${title} view`} sx={{ mt: 1 }}>
            <Button
              variant={studioView === 'draft' ? 'contained' : 'outlined'}
              onClick={onDraftView}
            >
              {primaryViewLabel}
            </Button>
            <Button
              variant={studioView === 'edit' ? 'contained' : 'outlined'}
              onClick={onEditView}
            >
              Edit
            </Button>
          </ButtonGroup>
        )}
      </Box>
    </Stack>
  );
};

export default ProjectsPageHeader;
