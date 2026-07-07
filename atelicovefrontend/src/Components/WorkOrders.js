import React, { useEffect, useState } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TableSortLabel,
    Chip,
    Alert,
    Button,
    ButtonGroup,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers } from '../model';
import { useAuth } from './AuthContext';

const WorkOrders = ({
    title = 'Work Orders',
    subtitle = 'Browse currently active work orders.',
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [workOrders, setWorkOrders] = useState([]);
    const [draftWorkOrders, setDraftWorkOrders] = useState([]);
    const [view, setView] = useState('active');
    const [summaryDialogWorkOrder, setSummaryDialogWorkOrder] = useState(null);
    const [summaryDialogMode, setSummaryDialogMode] = useState('items');
    const [orderBy, setOrderBy] = useState('workOrderID');
    const [order, setOrder] = useState('asc');
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([apiFetch('/workorders/all-with-archived'), apiFetch('/workorders/drafts')])
            .then(([workOrderData, draftWorkOrderData]) => {
                setWorkOrders(workOrderData);
                setDraftWorkOrders(draftWorkOrderData.map(order => ({
                    ...order,
                    status: order.status || 'DRAFT',
                    isDraftWorkOrder: true,
                })));
            })
            .catch(err => setError(err.message));
    }, []);

    const formatStatus = (status = '') => status.replaceAll('_', ' ');

    const handleSort = (column) => {
        const isAsc = orderBy === column && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(column);
    };

    const sourceWorkOrders = view === 'draft' ? draftWorkOrders : workOrders;
    const sortedWorkOrders = [...sourceWorkOrders].sort((a, b) => {
        const getValue = (workOrder) => {
            if (orderBy === 'company') return workOrder.company?.companyName || '';
            if (orderBy === 'workers') return getWorkOrderWorkers(workOrder).map(worker => worker.lastName).join(',');
            if (orderBy === 'actualPrice') return getWorkOrderActualPrice(workOrder);
            return workOrder[orderBy] ?? '';
        };
        if (getValue(a) < getValue(b)) {
            return order === 'asc' ? -1 : 1;
        }
        if (getValue(a) > getValue(b)) {
            return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
    const visibleWorkOrders = sortedWorkOrders.filter(workOrder => (
        !workOrder.archived
    ));

    const workOrderPrice = (workOrder = {}) => getWorkOrderActualPrice(workOrder);

    const openWorkOrder = (workOrder) => {
        if (workOrder.isDraftWorkOrder) {
            const projectID = workOrder.projectID || workOrder.project?.projectID;
            navigate(`/admin/draft-workorders/${projectID}/${workOrder.workOrderID}`);
            return;
        }

        const assignedToUser = getWorkOrderWorkers(workOrder).some(worker => worker.workerID === user?.workerID);
        if (assignedToUser && workOrder.status === 'IN_PROCESS') {
            navigate(`/admin/my-assignments/${workOrder.workOrderID}`);
            return;
        }

        navigate(`/admin/workorders/${workOrder.workOrderID}`);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{title}</Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
            <ButtonGroup variant="outlined" aria-label="Work order view" sx={{ mt: 1, mb: 3 }}>
                <Button variant={view === 'active' ? 'contained' : 'outlined'} onClick={() => setView('active')}>
                    Active
                </Button>
                <Button variant={view === 'draft' ? 'contained' : 'outlined'} onClick={() => setView('draft')}>
                    Draft
                </Button>
            </ButtonGroup>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'workOrderID'}
                                    direction={orderBy === 'workOrderID' ? order : 'asc'}
                                    onClick={() => handleSort('workOrderID')}
                                >
                                    Work Order ID
                                </TableSortLabel>
                            </TableCell>

                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'workers'}
                                    direction={orderBy === 'workers' ? order : 'asc'}
                                    onClick={() => handleSort('workers')}
                                >
                                    Assigned Workers
                                </TableSortLabel>
                            </TableCell>

                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'company'}
                                    direction={orderBy === 'company' ? order : 'asc'}
                                    onClick={() => handleSort('company')}
                                >
                                    Company
                                </TableSortLabel>
                            </TableCell>

                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'status'}
                                    direction={orderBy === 'status' ? order : 'asc'}
                                    onClick={() => handleSort('status')}
                                >
                                    Status
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Start</TableCell>
                            <TableCell>Close</TableCell>
                            <TableCell>Items</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'actualPrice'}
                                    direction={orderBy === 'actualPrice' ? order : 'asc'}
                                    onClick={() => handleSort('actualPrice')}
                                >
                                    Price
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Files</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {visibleWorkOrders.map((wo) => (
                            <TableRow key={wo.workOrderID}>
                                <TableCell>
                                    <Button
                                        size="small"
                                        onClick={() => openWorkOrder(wo)}
                                    >
                                        {wo.workOrderID}
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    {getWorkOrderWorkers(wo).map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned'}
                                </TableCell>
                                <TableCell>{wo.company?.companyName || 'Unassigned'}</TableCell>
                                <TableCell><Chip label={formatStatus(wo.status)} size="small" /></TableCell>
                                <TableCell>{formatDateTime(wo.startDateTime)}</TableCell>
                                <TableCell>{formatDateTime(wo.endDateTime)}</TableCell>
                                <TableCell>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setSummaryDialogMode('items');
                                            setSummaryDialogWorkOrder(wo);
                                        }}
                                    >
                                        {wo.items?.length ?? 0}
                                    </Button>
                                </TableCell>
                                <TableCell>{formatMoney(workOrderPrice(wo))}</TableCell>
                                <TableCell>{wo.fileNo ?? ''}</TableCell>
                            </TableRow>
                        ))}
                        {!visibleWorkOrders.length && (
                            <TableRow>
                                <TableCell colSpan={9}>No {view} work orders found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={Boolean(summaryDialogWorkOrder)} onClose={() => setSummaryDialogWorkOrder(null)} fullWidth maxWidth="sm">
                <DialogTitle>
                    {summaryDialogMode === 'summary'
                        ? `${summaryDialogWorkOrder?.isDraftWorkOrder ? 'Draft Work Order' : 'Work Order'} #${summaryDialogWorkOrder?.workOrderID}`
                        : `Work Order #${summaryDialogWorkOrder?.workOrderID} Items`}
                </DialogTitle>
                <DialogContent dividers>
                    {summaryDialogMode === 'summary' && (
                        <TableContainer sx={{ mb: 2 }}>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: 160 }}>Status</TableCell>
                                        <TableCell>{formatStatus(summaryDialogWorkOrder?.status)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                                        <TableCell>{summaryDialogWorkOrder?.projectName || 'No project'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                                        <TableCell>{summaryDialogWorkOrder?.company?.companyName || 'No company'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Workers</TableCell>
                                        <TableCell>{getWorkOrderWorkers(summaryDialogWorkOrder || {}).map(worker => `${worker.firstName} ${worker.lastName}`).join(', ') || 'Unassigned'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                                        <TableCell>{formatMoney(workOrderPrice(summaryDialogWorkOrder || {}))}</TableCell>
                                    </TableRow>
                                    {summaryDialogWorkOrder?.comment && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Note</TableCell>
                                            <TableCell>{summaryDialogWorkOrder.comment}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(summaryDialogWorkOrder?.items || []).map(item => (
                                    <TableRow key={item.workOrderItemID || item.draftWorkOrderItemID || item.itemName}>
                                        <TableCell>{item.itemName || 'Item'}</TableCell>
                                        <TableCell align="right">{item.quantity ?? 0}</TableCell>
                                        <TableCell align="right">{formatMoney(item.price)}</TableCell>
                                    </TableRow>
                                ))}
                                {!(summaryDialogWorkOrder?.items || []).length && (
                                    <TableRow>
                                        <TableCell colSpan={3}>No items are associated with this work order.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSummaryDialogWorkOrder(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WorkOrders;
