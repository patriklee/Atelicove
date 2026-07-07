import React from 'react';
import { Alert, Button, Stack } from '@mui/material';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <Stack spacing={2}>
      <Alert severity="error">{message}</Alert>
      {typeof onRetry === 'function' && (
        <Button variant="outlined" onClick={onRetry} sx={{ alignSelf: 'flex-start' }}>
          Try again
        </Button>
      )}
    </Stack>
  );
}
