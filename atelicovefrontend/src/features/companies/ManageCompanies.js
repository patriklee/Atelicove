import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Grid,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../api';
import { useAuth } from '../../Components/AuthContext';
import { ConfirmationDialog } from '../../shared/components/dialogs';
import { useConfirmationDialog } from '../../shared/hooks';
import { CompanyCreatePanel, CompanyEditPanel } from './components/CompanyFormPanels';
import CompanyTable from './components/CompanyTable';

const emptyCompany = {
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
};

const ManageCompanies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyID: routeCompanyID } = useParams();
  const [companies, setCompanies] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [companyID, setCompanyID] = useState(routeCompanyID || '');
  const [createForm, setCreateForm] = useState(emptyCompany);
  const [editForm, setEditForm] = useState(emptyCompany);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const confirmationDialog = useConfirmationDialog();
  const pendingAction = confirmationDialog.target?.action;
  const pendingCompany = confirmationDialog.target?.company;

  const loadData = useCallback(async () => {
    const [companyData, workOrderData] = await Promise.all([
      apiFetch('/companies/all'),
      apiFetch('/workorders/all-with-archived'),
    ]);

    setCompanies(companyData.sort((a, b) => a.companyName.localeCompare(b.companyName)));
    setWorkOrders(workOrderData);
  }, []);

  useEffect(() => {
    loadData().catch(error => {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    });
  }, [loadData]);

  useEffect(() => {
    if (routeCompanyID) {
      setCompanyID(routeCompanyID);
    }
  }, [routeCompanyID]);

  const selectedCompany = useMemo(
    () => companies.find(company => company.companyID === Number(companyID)),
    [companies, companyID]
  );

  const attachedWorkOrders = useMemo(
    () => selectedCompany
      ? workOrders.filter(order => order.company?.companyID === selectedCompany.companyID)
      : [],
    [selectedCompany, workOrders]
  );
  const canDeleteSelectedCompany = Boolean(selectedCompany && attachedWorkOrders.length === 0);

  useEffect(() => {
    if (selectedCompany) {
      setEditForm({
        companyName: selectedCompany.companyName || '',
        companyAddress: selectedCompany.companyAddress || '',
        companyPhone: selectedCompany.companyPhone || '',
        companyEmail: selectedCompany.companyEmail || '',
      });
    } else {
      setEditForm(emptyCompany);
    }
  }, [selectedCompany]);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm(current => ({ ...current, [name]: value }));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm(current => ({ ...current, [name]: value }));
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const requestPassword = (action, company = null) => {
    setPassword('');
    confirmationDialog.openDialog({ action, company });
  };

  const closePasswordDialog = () => {
    setPassword('');
    confirmationDialog.closeDialog();
  };

  const verifyPassword = () => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: user.username, password }),
  });

  const createCompany = async (event) => {
    event?.preventDefault?.();
    setSaving(true);

    try {
      const created = await apiFetch('/companies/add', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      setCreateForm(emptyCompany);
      setCompanyID(String(created.companyID));
      await loadData();
      showMessage('Company created successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateCompany = async () => {
    if (!selectedCompany) return;

    setSaving(true);
    try {
      await verifyPassword();
      await apiFetch(`/companies/${selectedCompany.companyID}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      await loadData();
      closePasswordDialog();
      showMessage('Company updated successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const archiveCompany = async (company) => {
    if (!company || !window.confirm(`Archive ${company.companyName}?`)) return;

    setSaving(true);
    try {
      await apiFetch(`/companies/${company.companyID}`, { method: 'DELETE' });
      if (Number(companyID) === company.companyID) {
        setCompanyID('');
      }
      await loadData();
      showMessage('Company archived successfully.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async () => {
    if (!selectedCompany || !canDeleteSelectedCompany) return;

    setSaving(true);
    try {
      await verifyPassword();
      await apiFetch(`/companies/${selectedCompany.companyID}/permanent`, { method: 'DELETE' });
      setCompanyID('');
      await loadData();
      closePasswordDialog();
      showMessage('Company permanently deleted.');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const runPendingAction = () => {
    if (pendingAction === 'create') {
      createCompany();
      return;
    }
    if (pendingAction === 'update') {
      updateCompany();
      return;
    }
    if (pendingAction === 'archive') {
      archiveCompany(pendingCompany);
      return;
    }
    if (pendingAction === 'delete') {
      deleteCompany();
    }
  };

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Companies</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Create and edit active companies.</Typography>

      <Grid container spacing={3} alignItems="stretch">
        <CompanyCreatePanel form={createForm} saving={saving} onChange={handleCreateChange} onSubmit={createCompany} />
        <CompanyEditPanel
          companies={companies}
          companyID={companyID}
          form={editForm}
          selectedCompany={selectedCompany}
          attachedWorkOrders={attachedWorkOrders}
          canDelete={canDeleteSelectedCompany}
          saving={saving}
          onCompanyChange={setCompanyID}
          onChange={handleEditChange}
          onUpdate={() => requestPassword('update')}
          onDelete={() => requestPassword('delete')}
          onOpenWorkOrder={order => navigate(`/admin/workorders/${order.workOrderID}`)}
        />
        <CompanyTable
          companies={companies}
          saving={saving}
          onView={company => navigate(`/admin/companies/${company.companyID}`)}
          onArchive={archiveCompany}
        />
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(current => ({ ...current, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      <ConfirmationDialog
        open={confirmationDialog.open}
        title={pendingAction === 'delete' ? 'Delete Company' : 'Confirm Changes'}
        confirmLabel={pendingAction === 'delete' ? 'Delete' : 'Confirm'}
        confirmColor={pendingAction === 'delete' ? 'error' : 'primary'}
        onConfirm={runPendingAction}
        onCancel={closePasswordDialog}
        disabled={!password}
        loading={saving}
      >
          {pendingAction === 'delete' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This permanently deletes a company with no attached work orders and cannot be undone.
            </Alert>
          )}
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

export default ManageCompanies;
