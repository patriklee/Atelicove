import React from 'react';
import { Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppIcon, icons } from '../../icons';

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
      startIcon={<AppIcon icon={icons.back} />}
      onClick={handleBack}
      aria-label={label}
      sx={{ mb: 2, alignSelf: 'flex-start', ...sx }}
    >
      {label}
    </Button>
  );
}
