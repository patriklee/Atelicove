import React from 'react';
import { Button } from '@mui/material';

const TableNavigationButton = ({ children, ...props }) => (
  <Button size="small" {...props}>{children}</Button>
);

export default TableNavigationButton;
