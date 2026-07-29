import React, { forwardRef } from 'react';
import { Select } from '@mui/material';
import AppIcon, { ICON_SIZES } from './AppIcon';
import icons from './iconMap';

export const AppSelectIndicator = forwardRef(function AppSelectIndicator(props, ref) {
  const iconProps = { ...props };
  delete iconProps.ownerState;

  return (
    <AppIcon
      {...iconProps}
      icon={icons.expand}
      ref={ref}
      size={ICON_SIZES.standard}
    />
  );
});

const AppSelect = forwardRef(function AppSelect({
  IconComponent = AppSelectIndicator,
  ...props
}, ref) {
  return <Select {...props} IconComponent={IconComponent} ref={ref} />;
});

export default AppSelect;
