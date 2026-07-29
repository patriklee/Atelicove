import React, { forwardRef } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import AppIcon, { ICON_SIZES } from './AppIcon';

const focusStyles = {
  '&.Mui-focusVisible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: '2px',
  },
};

const AppIconButton = forwardRef(function AppIconButton({
  icon,
  label,
  tooltip = label,
  iconSize = ICON_SIZES.standard,
  iconProps,
  disabled = false,
  sx,
  children,
  ...buttonProps
}, ref) {
  if (!label) {
    throw new Error('AppIconButton requires an accessible label.');
  }

  const button = (
    <IconButton
      {...buttonProps}
      aria-label={label}
      disabled={disabled}
      ref={ref}
      sx={[focusStyles, ...(Array.isArray(sx) ? sx : [sx])].filter(Boolean)}
    >
      {children ?? <AppIcon icon={icon} size={iconSize} {...iconProps} />}
    </IconButton>
  );

  if (!tooltip) return button;

  return (
    <Tooltip title={tooltip}>
      {disabled ? <span style={{ display: 'inline-flex' }}>{button}</span> : button}
    </Tooltip>
  );
});

export default AppIconButton;
