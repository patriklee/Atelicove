import React, { forwardRef } from 'react';

export const ICON_SIZES = Object.freeze({
  compact: 17,
  standard: 19,
  large: 36,
});

export const DEFAULT_ICON_STROKE_WIDTH = 1.7;

const AppIcon = forwardRef(function AppIcon({
  icon: Icon,
  size = ICON_SIZES.standard,
  strokeWidth = DEFAULT_ICON_STROKE_WIDTH,
  label,
  decorative,
  className,
  color = 'currentColor',
  style,
  ...svgProps
}, ref) {
  if (decorative === false && !label) {
    throw new Error('AppIcon requires a label when decorative is false.');
  }

  const isDecorative = decorative ?? !label;

  return (
    <Icon
      {...svgProps}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={isDecorative ? undefined : label}
      className={className}
      color={color}
      focusable="false"
      height={size}
      ref={ref}
      role={isDecorative ? undefined : 'img'}
      strokeWidth={strokeWidth}
      style={{ display: 'block', flexShrink: 0, ...style }}
      width={size}
    />
  );
});

export default AppIcon;
