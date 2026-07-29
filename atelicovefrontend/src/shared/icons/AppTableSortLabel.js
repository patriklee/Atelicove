import React, { forwardRef } from 'react';
import { TableSortLabel } from '@mui/material';
import AppIcon, { ICON_SIZES } from './AppIcon';
import icons from './iconMap';

export const AppSortIndicator = forwardRef(function AppSortIndicator(props, ref) {
  const iconProps = { ...props };
  delete iconProps.ownerState;

  return (
    <AppIcon
      {...iconProps}
      icon={icons.sortDown}
      ref={ref}
      size={ICON_SIZES.compact}
    />
  );
});

const AppTableSortLabel = forwardRef(function AppTableSortLabel({
  IconComponent = AppSortIndicator,
  ...props
}, ref) {
  return <TableSortLabel {...props} IconComponent={IconComponent} ref={ref} />;
});

export default AppTableSortLabel;
