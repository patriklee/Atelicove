import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { formatDateTime, getWorkOrderWorkers } from '../model';
import { useAuth } from './AuthContext';

const WorkOrders = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [workOrders, setWorkOrders] = useState([]);
    const [orderBy, setOrderBy] = useState('workOrderID');
    const [order, setOrder] = useState('asc');
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch('/workorders')
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Active Work Orders
                </Typography>
            </Box>
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
                            <TableCell>Files</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {sortedWorkOrders.map((wo) => (
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
                                <TableCell>{wo.fileNo ?? ''}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default WorkOrders;
