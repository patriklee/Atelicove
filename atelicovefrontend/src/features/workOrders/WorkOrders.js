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
    Chip,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { workOrderService } from '../../services/workOrderService';
import { formatDateTime, formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers } from '../../model';
import { useAuth } from '../../Components/AuthContext';
import { AppAlert, AppTableSortLabel } from '../../shared/icons';

const WorkOrders = ({
    title = 'Work Orders',
    subtitle = 'Browse currently active work orders.',
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [workOrders, setWorkOrders] = useState([]);
    const [summaryDialogWorkOrder, setSummaryDialogWorkOrder] = useState(null);
    const [summaryDialogMode, setSummaryDialogMode] = useState('items');
    const [orderBy, setOrderBy] = useState('workOrderID');
    const [order, setOrder] = useState('asc');
    const [error, setError] = useState('');

    useEffect(() => {
        workOrderService.getAllIncludingArchived()
            .then(setWorkOrders)
            .catch(err => setError(err.message));
    }, []);

    const formatStatus = (status = '') => status.replaceAll('_', ' ');

    const handleSort = (column) => {
        const isAsc = orderBy === column && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(column);
    };

    const sortedWorkOrders = [...workOrders].sort((a, b) => {
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
            {error && <AppAlert severity="error" sx={{ mb: 2 }}>{error}</AppAlert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <AppTableSortLabel
                                    active={orderBy === 'workOrderID'}
                                    direction={orderBy === 'workOrderID' ? order : 'asc'}
                                    onClick={() => handleSort('workOrderID')}
                                >
                                    Work Order ID
                                </AppTableSortLabel>
                            </TableCell>

                            <TableCell>
                                <AppTableSortLabel
                                    active={orderBy === 'workers'}
                                    direction={orderBy === 'workers' ? order : 'asc'}
                                    onClick={() => handleSort('workers')}
                                >
                                    Assigned Workers
                                </AppTableSortLabel>
                            </TableCell>

                            <TableCell>
                                <AppTableSortLabel
                                    active={orderBy === 'company'}
                                    direction={orderBy === 'company' ? order : 'asc'}
                                    onClick={() => handleSort('company')}
                                >
                                    Company
                                </AppTableSortLabel>
                            </TableCell>

                            <TableCell>
                                <AppTableSortLabel
                                    active={orderBy === 'status'}
                                    direction={orderBy === 'status' ? order : 'asc'}
                                    onClick={() => handleSort('status')}
                                >
                                    Status
                                </AppTableSortLabel>
                            </TableCell>
                            <TableCell>Start</TableCell>
                            <TableCell>Close</TableCell>
                            <TableCell>Items</TableCell>
                            <TableCell>
                                <AppTableSortLabel
                                    active={orderBy === 'actualPrice'}
                                    direction={orderBy === 'actualPrice' ? order : 'asc'}
                                    onClick={() => handleSort('actualPrice')}
                                >
                                    Price
                                </AppTableSortLabel>
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
                                <TableCell colSpan={9}>No active work orders found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={Boolean(summaryDialogWorkOrder)} onClose={() => setSummaryDialogWorkOrder(null)} fullWidth maxWidth="sm">
                <DialogTitle>
                    {summaryDialogMode === 'summary'
                        ? `Work Order #${summaryDialogWorkOrder?.workOrderID}`
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
                                    <TableRow key={item.workOrderItemID || item.itemName}>
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
