import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../api';
import { authService } from '../../services/authService';
import { getWorkOrderWorkers } from '../../model';
import { useAuth } from '../../Components/AuthContext';
import { ConfirmationDialog } from '../../shared/components/dialogs';
import { BackNavigation } from '../../shared/components/navigation';
import WorkOrderDetail from './WorkOrderDetail';
import { WorkOrderDocuments } from '../documents';
import { projectPathFor } from '../../shared/routing/rolePaths';
import MyWorkOrderOverviewSection from './components/MyWorkOrderOverviewSection';
import WorkOrderCommentsSection from './components/WorkOrderCommentsSection';
import WorkOrderItemsSection from './components/WorkOrderItemsSection';

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
  const getItemID = (item) => item?.workOrderItemID;
  const itemApiBase = `/workorders/${workOrder.workOrderID}/items`;
  const editingItemIDs = new Set(editItems.filter(item => !item.isNew).map(getItemID));
  const displayedSavedItems = savedItems
    .filter(item => Number(item.quantity) > 0)
    .filter(item => !editingItemIDs.has(getItemID(item)))
    .filter(item => item.createdAt || item.lastModifiedAt)
    .sort((a, b) => new Date(b.createdAt || b.lastModifiedAt) - new Date(a.createdAt || a.lastModifiedAt));
  const total = [...displayedSavedItems, ...editItems]
    .reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
  const project = workOrder.project || (workOrder.projectID ? {
    projectID: workOrder.projectID,
    projectName: workOrder.projectName,
  } : null);
  const openProject = () => {
    if (!project?.projectID) return;
    navigate(projectPathFor(user, project.projectID));
  };
  const requestPassword = (action) => {
    setPendingAction(action);
    setPassword('');
    setPasswordOpen(true);
  };

  const verifyPassword = () => authService.verifyPassword({ username: user.username, password });

  const updateItemField = (itemID, field, value) => {
    setEditItems(current => current.map(item => (
      getItemID(item) === itemID ? { ...item, [field]: value } : item
    )));
  };

  const editItem = (item) => {
    setEditItems(current => {
      if (current.some(currentItem => getItemID(currentItem) === getItemID(item))) {
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
      const updated = await apiFetch(`${itemApiBase}/${getItemID(item)}`, {
        method: 'DELETE',
      });
      setWorkOrder(updated);
      setSavedItems(Array.isArray(updated.items) ? updated.items : []);
      setEditItems(current => current.filter(currentItem => getItemID(currentItem) !== getItemID(item)));
      setMessage({ severity: 'success', text: 'Item deleted.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveItems = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let updated = workOrder;
      for (const item of editItems) {
        if (Number(item.quantity) <= 0) {
          if (!item.isNew) {
            updated = await apiFetch(`${itemApiBase}/${getItemID(item)}`, {
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
          ? await apiFetch(itemApiBase, {
              method: 'POST',
              body: JSON.stringify(payload),
            })
          : await apiFetch(`${itemApiBase}/${getItemID(item)}`, {
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
      <BackNavigation fallback={user?.isAdmin || user?.admin ? '/admin/my-assignments' : '/worker/my-assignments'} />
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Work Order #{workOrder.workOrderID}
      </Typography>
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <MyWorkOrderOverviewSection
        workOrder={workOrder}
        workers={workers}
        project={project}
        canOpenProject={user?.isAdmin}
        onOpenProject={openProject}
      />

      <WorkOrderCommentsSection
        comment={comment}
        editing={editingComment}
        saving={saving}
        onCommentChange={setComment}
        onStartEditing={() => setEditingComment(true)}
        onUpdate={updateComment}
      />

      <WorkOrderItemsSection
        savedItems={displayedSavedItems}
        editItems={editItems}
        total={total}
        saving={saving}
        getItemID={getItemID}
        onEdit={editItem}
        onDelete={deleteSavedItem}
        onFieldChange={updateItemField}
        onRemoveEdit={itemID => setEditItems(current => current.filter(item => getItemID(item) !== itemID))}
        onAdd={item => setEditItems(current => [...current, item])}
        onSave={saveItems}
      />

      <WorkOrderDocuments workOrderID={workOrder.workOrderID} canManage={workOrder.status !== 'COMPLETE'} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" color="success" onClick={() => requestPassword('submit')}>
            Submit for Review
          </Button>
      </Box>

      <ConfirmationDialog
        open={passwordOpen}
        title="Confirm Changes"
        confirmLabel="Submit for Review"
        onConfirm={runPendingAction}
        onCancel={() => setPasswordOpen(false)}
        disabled={!password}
        loading={saving}
      >
        <TextField
          label="Enter your password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          fullWidth
          margin="normal"
        />
      </ConfirmationDialog>
    </Box>
  );
};

export default MyWorkOrderDetail;
