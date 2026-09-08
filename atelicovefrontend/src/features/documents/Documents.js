import React, { useEffect, useState } from 'react';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { apiDownload, apiFetch } from '../../shared/api';
import { formatDateTime } from '../../model';
import { PageContainer, PageHeader, PageSections } from '../../shared/components/layout';
import { MetricSummary } from '../../shared/components/metrics';
import { EntityEmptyState } from '../../shared/components/tables';
import { AppAlert, icons } from '../../shared/icons';

const formatFileSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch('/documents')
      .then(setDocuments)
      .catch(error => setMessage({ severity: 'error', text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const downloadDocument = async (document) => {
    setBusy(true);
    setMessage(null);
    try {
      const ownerPath = document.projectID
        ? `/projects/${document.projectID}/documents`
        : `/workorders/${document.workOrderID}/documents`;
      const blob = await apiDownload(`${ownerPath}/${document.documentID}/download`);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const documentMetrics = [
    { label: 'Total Documents', value: documents.length, detail: 'Available files', icon: icons.documents },
    {
      label: 'Project Documents',
      value: documents.filter(document => document.projectID != null).length,
      detail: 'Linked to projects',
      icon: icons.projects,
    },
    {
      label: 'Work Order Documents',
      value: documents.filter(document => document.workOrderID != null).length,
      detail: 'Linked to work orders',
      icon: icons.workOrders,
    },
    {
      label: 'Storage Used',
      value: formatFileSize(documents.reduce((total, document) => total + Number(document.fileSize || 0), 0)),
      detail: 'Across all documents',
      icon: icons.archive,
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Documents" subtitle="Browse uploaded work order and project documents." />
      <PageSections>
        {message && <AppAlert severity={message.severity}>{message.text}</AppAlert>}
        <MetricSummary metrics={documentMetrics} ariaLabel="Document summary" />

        <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Work Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Size</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map(document => (
              <TableRow key={`${document.projectID ? 'project' : 'workorder'}-${document.projectID || document.workOrderID}-${document.documentID}`} hover>
                <TableCell>{document.fileName}</TableCell>
                <TableCell>{document.documentType?.replaceAll('_', ' ') || 'Not set'}</TableCell>
                <TableCell>{document.projectID ? document.projectName || `Project #${document.projectID}` : 'No project'}</TableCell>
                <TableCell>{document.workOrderID ? `#${document.workOrderID}` : 'No work order'}</TableCell>
                <TableCell>{(document.projectStatus || document.workOrderStatus)?.replaceAll('_', ' ') || 'Not set'}</TableCell>
                <TableCell>{document.companyName || 'No company'}</TableCell>
                <TableCell>{document.uploadedBy || 'Not recorded'}</TableCell>
                <TableCell>{formatDateTime(document.createdAt)}</TableCell>
                <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                <TableCell align="right">
                  <Button size="small" disabled={busy} onClick={() => downloadDocument(document)}>
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !documents.length && (
              <EntityEmptyState message="No documents have been uploaded." colSpan={10} />
            )}
            {loading && (
              <EntityEmptyState message="Loading documents..." colSpan={10} />
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </PageSections>
    </PageContainer>
  );
};

export default Documents;
