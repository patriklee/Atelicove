import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers } from '../model';
import { useAuth } from './AuthContext';
import WorkOrderDetail from './WorkOrderDetail';
import WorkOrderDocuments from './WorkOrderDocuments';
import TableTitleRow from './TableTitleRow';

const money = (value) => Number(value || 0).toLocaleString(undefined, {
  style: 'currency',
  currency: 'USD',
});

const ITEM_TYPES = ['LABOR', 'MATERIAL', 'OTHER'];

const emptyItem = () => ({
  workOrderItemID: `new-${Date.now()}`,
  itemType: 'LABOR',
  itemName: '',
  quantity: 1,
  price: 0,
  isNew: true,
});

const MyWorkOrderDetail = () => {
  const { workOrderID } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workOrder, setWorkOrder] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [editItems, setEditItems] = useState([]);
  const [comment, setComment] = useState('');
  const [editingComment, setEditingComment] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = () => {
    setLoading(true);
    apiFetch(`/workorders/${workOrderID}`)
      .then(data => {
        setWorkOrder(data);
        setSavedItems(Array.isArray(data.items) ? data.items : []);
        setEditItems([]);
        setComment(data.comment || '');
      })
      .catch(error => setMessage({ severity: 'error', text: error.message }))
      .finally(() => setLoading(false));
  };

  useEffect(load, [workOrderID]);

  if (loading) return <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (!workOrder) return <Alert severity="warning">Work order not found.</Alert>;
  if (workOrder.archived) return <Alert severity="warning">This work order is archived and no longer appears in My Assignments.</Alert>;

  if (['IN_REVIEW', 'COMPLETE'].includes(workOrder.status)) {
    return <WorkOrderDetail canManageDocuments={workOrder.status !== 'COMPLETE'} />;
  }

  const workers = getWorkOrderWorkers(workOrder);
  const editingItemIDs = new Set(editItems.filter(item => !item.isNew).map(item => item.workOrderItemID));
  const displayedSavedItems = savedItems
    .filter(item => Number(item.quantity) > 0)
    .filter(item => !editingItemIDs.has(item.workOrderItemID))
    .filter(item => item.createdAt || item.lastModifiedAt)
    .sort((a, b) => new Date(b.createdAt || b.lastModifiedAt) - new Date(a.createdAt || a.lastModifiedAt));
  const total = [...displayedSavedItems, ...editItems]
    .reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
  const requestPassword = (action) => {
    setPendingAction(action);
    setPassword('');
    setPasswordOpen(true);
  };

  const verifyPassword = () => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: user.username, password }),
  });

  const updateItemField = (itemID, field, value) => {
    setEditItems(current => current.map(item => (
      item.workOrderItemID === itemID ? { ...item, [field]: value } : item
    )));
  };

  const editItem = (item) => {
    setEditItems(current => {
      if (current.some(currentItem => currentItem.workOrderItemID === item.workOrderItemID)) {
        return current;
      }

      return [...current, { ...item, isNew: false }];
    });
  };

  const deleteSavedItem = async (item) => {
    if (!window.confirm(`Delete ${item.itemName || 'this item'}?`)) return;

    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiFetch(`/workorders/${workOrder.workOrderID}/items/${item.workOrderItemID}`, {
        method: 'DELETE',
      });
      setWorkOrder(updated);
      setSavedItems(Array.isArray(updated.items) ? updated.items : []);
      setEditItems(current => current.filter(currentItem => currentItem.workOrderItemID !== item.workOrderItemID));
      setMessage({ severity: 'success', text: 'Item deleted.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateItemQuantity = (itemID, value) => {
    updateItemField(itemID, 'quantity', value);
  };

  const saveItems = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let updated = workOrder;
      for (const item of editItems) {
        if (Number(item.quantity) <= 0) {
          if (!item.isNew) {
            updated = await apiFetch(`/workorders/${workOrder.workOrderID}/items/${item.workOrderItemID}`, {
              method: 'DELETE',
            });
          }
          continue;
        }

        const payload = {
          itemType: item.itemType || 'OTHER',
          itemName: item.itemName,
          quantity: Number(item.quantity),
          price: Number(item.price),
        };

        updated = item.isNew
          ? await apiFetch(`/workorders/${workOrder.workOrderID}/items`, {
              method: 'POST',
              body: JSON.stringify(payload),
            })
          : await apiFetch(`/workorders/${workOrder.workOrderID}/items/${item.workOrderItemID}`, {
              method: 'PUT',
              body: JSON.stringify(payload),
            });
      }
      setWorkOrder(updated);
      setSavedItems(Array.isArray(updated.items) ? updated.items : []);
      setEditItems([]);
      setMessage({ severity: 'success', text: 'Items updated.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateComment = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiFetch(`/workorders/${workOrder.workOrderID}/comment`, {
        method: 'PUT',
        body: JSON.stringify({ comment }),
      });
      setWorkOrder(updated);
      setEditingComment(false);
      setMessage({ severity: 'success', text: 'Comments updated.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await verifyPassword();
      const updated = await apiFetch(`/workorders/${workOrder.workOrderID}/submit`, { method: 'PUT' });
      setWorkOrder(updated);
      setPassword('');
      setPasswordOpen(false);
      setPendingAction(null);
      setMessage({ severity: 'success', text: 'Work order submitted for review.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const runPendingAction = () => {
    if (pendingAction === 'submit') {
      submitForReview();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Work Order #{workOrder.workOrderID}
      </Typography>
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableTitleRow title="Details" colSpan={2} />
          </TableHead>
          <TableBody>
            <TableRow><TableCell sx={{ fontWeight: 600, width: 220 }}>Status</TableCell><TableCell>{workOrder.status.replaceAll('_', ' ')}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Start</TableCell><TableCell>{formatDateTime(workOrder.startDateTime)}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Company</TableCell><TableCell>{workOrder.company?.companyName || 'No company'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Assigned Workers</TableCell><TableCell>{workers.map(worker => `${worker.firstName} ${worker.lastName}`).join(', ')}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableTitleRow title="Comments" colSpan={2} />
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: 220 }}>Work Notes</TableCell>
              <TableCell>
                <TextField
                  value={comment}
                  onChange={event => setComment(event.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  disabled={!editingComment}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                  <Button onClick={() => setEditingComment(true)}>Edit</Button>
                  <Button variant="contained" onClick={updateComment} disabled={!editingComment || saving}>Update</Button>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

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
            {displayedSavedItems.map(item => (
              <TableRow key={`saved-${item.workOrderItemID}`}>
                <TableCell>{item.itemType || 'Not set'}</TableCell>
                <TableCell>{item.itemName || 'Unnamed item'}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{money(item.price)}</TableCell>
                <TableCell align="right">{money(Number(item.quantity) * Number(item.price))}</TableCell>
                <TableCell align="right">
                  <Button size="small" disabled={saving} onClick={() => editItem(item)}>
                    Edit
                  </Button>
                  <Button size="small" color="error" disabled={saving} onClick={() => deleteSavedItem(item)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {editItems.map(item => (
              <TableRow key={`edit-${item.workOrderItemID}`}>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <InputLabel>Item Type</InputLabel>
                    <Select
                      value={item.itemType || 'OTHER'}
                      label="Item Type"
                      onChange={event => updateItemField(item.workOrderItemID, 'itemType', event.target.value)}
                    >
                      {ITEM_TYPES.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <TextField
                    value={item.itemName || ''}
                    onChange={event => updateItemField(item.workOrderItemID, 'itemName', event.target.value)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    value={item.quantity}
                    onChange={event => updateItemQuantity(item.workOrderItemID, event.target.value)}
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    value={item.price}
                    onChange={event => updateItemField(item.workOrderItemID, 'price', event.target.value)}
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: '0.01' }}
                  />
                </TableCell>
                <TableCell align="right">{money(Number(item.quantity) * Number(item.price))}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="warning"
                    disabled={saving}
                    onClick={() => setEditItems(current => current.filter(currentItem => currentItem.workOrderItemID !== item.workOrderItemID))}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!displayedSavedItems.length && !editItems.length && (
              <TableRow>
                <TableCell colSpan={6}>No items are currently listed.</TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{money(total)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2 }}>
          <Button onClick={() => setEditItems(current => [...current, emptyItem()])}>Add Item</Button>
          <Button variant="contained" onClick={saveItems} disabled={saving || !editItems.length}>Save Items</Button>
        </Box>
      </TableContainer>

      <WorkOrderDocuments workOrderID={workOrder.workOrderID} canManage={workOrder.status !== 'COMPLETE'} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" color="success" onClick={() => requestPassword('submit')}>
          Submit for Review
        </Button>
      </Box>

      <Dialog open={passwordOpen} onClose={() => setPasswordOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Confirm Changes</DialogTitle>
        <DialogContent>
          <TextField
            label="Enter your password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={runPendingAction} disabled={!password || saving}>
            Submit for Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyWorkOrderDetail;
