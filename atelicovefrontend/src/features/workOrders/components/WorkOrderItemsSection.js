import React from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { EntityEmptyState, TableTitleRow } from '../../../shared/components/tables';
import { AppSelect } from '../../../shared/icons';

const ITEM_TYPES = ['LABOR', 'MATERIAL', 'OTHER'];

const money = (value) => Number(value || 0).toLocaleString(undefined, {
  style: 'currency',
  currency: 'USD',
});

const emptyItem = () => ({
  workOrderItemID: `new-${Date.now()}`,
  itemType: 'LABOR',
  itemName: '',
  quantity: 1,
  price: 0,
  isNew: true,
});

const WorkOrderItemsSection = ({
  savedItems,
  editItems,
  total,
  saving,
  getItemID,
  onEdit,
  onDelete,
  onFieldChange,
  onRemoveEdit,
  onAdd,
  onSave,
}) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableTitleRow title="Items" colSpan={6} />
        <TableRow>
          <TableCell>Item Type</TableCell>
          <TableCell>Item Name</TableCell>
          <TableCell align="right">Quantity</TableCell>
          <TableCell align="right">Price</TableCell>
          <TableCell align="right">Line Total</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {savedItems.map(item => (
          <TableRow key={`saved-${getItemID(item)}`}>
            <TableCell>{item.itemType || 'Not set'}</TableCell>
            <TableCell>{item.itemName || 'Unnamed item'}</TableCell>
            <TableCell align="right">{item.quantity}</TableCell>
            <TableCell align="right">{money(item.price)}</TableCell>
            <TableCell align="right">{money(Number(item.quantity) * Number(item.price))}</TableCell>
            <TableCell align="right">
              <Button size="small" disabled={saving} onClick={() => onEdit(item)}>Edit</Button>
              <Button size="small" color="error" disabled={saving} onClick={() => onDelete(item)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
        {editItems.map(item => (
          <TableRow key={`edit-${getItemID(item)}`}>
            <TableCell>
              <FormControl fullWidth size="small">
                <InputLabel>Item Type</InputLabel>
                <AppSelect
                  value={item.itemType || 'OTHER'}
                  label="Item Type"
                  onChange={event => onFieldChange(getItemID(item), 'itemType', event.target.value)}
                >
                  {ITEM_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </AppSelect>
              </FormControl>
            </TableCell>
            <TableCell>
              <TextField
                value={item.itemName || ''}
                onChange={event => onFieldChange(getItemID(item), 'itemName', event.target.value)}
                size="small"
              />
            </TableCell>
            <TableCell align="right">
              <TextField
                value={item.quantity}
                onChange={event => onFieldChange(getItemID(item), 'quantity', event.target.value)}
                size="small"
                type="number"
                inputProps={{ min: 0 }}
              />
            </TableCell>
            <TableCell align="right">
              <TextField
                value={item.price}
                onChange={event => onFieldChange(getItemID(item), 'price', event.target.value)}
                size="small"
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
              />
            </TableCell>
            <TableCell align="right">{money(Number(item.quantity) * Number(item.price))}</TableCell>
            <TableCell align="right">
              <Button size="small" color="warning" disabled={saving} onClick={() => onRemoveEdit(getItemID(item))}>
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {!savedItems.length && !editItems.length && (
          <EntityEmptyState message="No items are currently listed." colSpan={6} />
        )}
        <TableRow>
          <TableCell colSpan={4} align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
          <TableCell align="right" sx={{ fontWeight: 600 }}>{money(total)}</TableCell>
          <TableCell />
        </TableRow>
      </TableBody>
    </Table>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2 }}>
      <Button onClick={() => onAdd(emptyItem())}>Add Item</Button>
      <Button variant="contained" onClick={onSave} disabled={saving || !editItems.length}>Save Items</Button>
    </Box>
  </TableContainer>
);

export default WorkOrderItemsSection;
