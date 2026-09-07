import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { workOrderService } from '../../services/workOrderService';
import { formatDateTime, formatMoney, getWorkOrderActualPrice, getWorkOrderWorkers } from '../../model';
import { useAuth } from '../../Components/AuthContext';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { TableNavigationButton } from '../../shared/components/navigation';
import { EntityEmptyState } from '../../shared/components/tables';
import { AppAlert, AppTableSortLabel } from '../../shared/icons';
import WorkOrderSummaryDialog from './components/WorkOrderSummaryDialog';

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
        <PageContainer>
            <PageHeader title={title} subtitle={subtitle} />
            <PageSections>
            {error && <AppAlert severity="error">{error}</AppAlert>}

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
                            <TableRow key={wo.workOrderID} hover>
                                <TableCell>
                                    <TableNavigationButton
                                        onClick={() => openWorkOrder(wo)}
                                    >
                                        {wo.workOrderID}
                                    </TableNavigationButton>
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
                            <EntityEmptyState message="No active work orders found." colSpan={9} />
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            </PageSections>

            <WorkOrderSummaryDialog
                workOrder={summaryDialogWorkOrder}
                mode={summaryDialogMode}
                onClose={() => setSummaryDialogWorkOrder(null)}
            />
        </PageContainer>
    );
};

export default WorkOrders;
