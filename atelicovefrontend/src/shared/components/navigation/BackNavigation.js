import React from 'react';
import { ArrowBack } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BackNavigation({ fallback = '/admin', label = 'Back', sx }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (location.key && location.key !== 'default') {
      navigate(-1);
      return;
    }
    navigate(fallback, { replace: true });
  };

  return (
    <Button
      startIcon={<ArrowBack />}
      onClick={handleBack}
      aria-label={label}
      sx={{ mb: 2, alignSelf: 'flex-start', ...sx }}
    >
      {label}
    </Button>
  );
}
