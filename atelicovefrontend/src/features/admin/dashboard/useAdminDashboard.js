import { useCallback, useEffect, useMemo, useState } from 'react';
import { dashboardService } from './dashboardService';
import {
  getDashboardAlertEntries,
  getDashboardDeadlines,
  getUpcomingDeadlines,
  groupSearchResults,
} from './dashboardUtils';

const emptyData = { projects: [], workOrders: [], companies: [], workers: [] };

export default function useAdminDashboard() {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [deletingDeadline, setDeletingDeadline] = useState(false);
  const [deadlineMessage, setDeadlineMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await dashboardService.load());
    } catch (requestError) {
      setError(requestError.message || 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const deadlines = useMemo(() => getDashboardDeadlines(data.projects), [data.projects]);
  const alertEntries = useMemo(() => getDashboardAlertEntries(data), [data]);

  const saveDeadline = async ({ projectID, actionItem, itemText, dueDate }) => {
    setSavingDeadline(true);
    setDeadlineMessage(null);
    const payload = {
      itemText: itemText.trim(),
      dueDate: `${dueDate}T17:00:00`,
      assignedWorker: actionItem?.assignedWorker || null,
      assignedTeam: actionItem?.assignedTeam || null,
    };
    try {
      if (actionItem) {
        await dashboardService.updateDeadline(projectID, actionItem.actionItemID, payload);
      } else {
        await dashboardService.createDeadline(projectID, payload);
      }
      await load();
      setDeadlineMessage({ severity: 'success', text: actionItem ? 'Deadline updated.' : 'Deadline created.' });
      return true;
    } catch (requestError) {
      setDeadlineMessage({ severity: 'error', text: requestError.message || 'Deadline could not be saved.' });
      return false;
    } finally {
      setSavingDeadline(false);
    }
  };

  const deleteDeadline = async ({ projectID, actionItemID }) => {
    setDeletingDeadline(true);
    setDeadlineMessage(null);
    try {
      await dashboardService.deleteDeadline(projectID, actionItemID);
      await load();
      setDeadlineMessage({ severity: 'success', text: 'Deadline deleted.' });
      return true;
    } catch (requestError) {
      setDeadlineMessage({ severity: 'error', text: requestError.message || 'Deadline could not be deleted.' });
      return false;
    } finally {
      setDeletingDeadline(false);
    }
  };

  return {
    data,
    loading,
    error,
    query,
    setQuery,
    searchResults: useMemo(() => groupSearchResults(data, debouncedQuery), [data, debouncedQuery]),
    searchReady: debouncedQuery.length >= 2,
    alertEntries,
    workQueue: alertEntries.filter(entry => entry.count > 0),
    deadlines,
    upcomingDeadlines: useMemo(() => getUpcomingDeadlines(deadlines), [deadlines]),
    savingDeadline,
    deletingDeadline,
    deadlineMessage,
    saveDeadline,
    deleteDeadline,
    reload: load,
  };
}
