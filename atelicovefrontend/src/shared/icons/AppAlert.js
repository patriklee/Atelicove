import React, { forwardRef } from 'react';
import { Alert } from '@mui/material';
import AppIcon from './AppIcon';
import icons from './iconMap';

export const APP_ALERT_ICON_MAPPING = Object.freeze({
  error: <AppIcon icon={icons.error} />,
  info: <AppIcon icon={icons.information} />,
  success: <AppIcon icon={icons.success} />,
  warning: <AppIcon icon={icons.warning} />,
});

const AppAlert = forwardRef(function AppAlert({ iconMapping, ...props }, ref) {
  return (
    <Alert
      {...props}
      iconMapping={{ ...APP_ALERT_ICON_MAPPING, ...iconMapping }}
      ref={ref}
    />
  );
});

export default AppAlert;
