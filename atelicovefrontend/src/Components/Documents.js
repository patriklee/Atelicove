import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { apiDownload, apiFetch } from '../api';
import { formatDateTime } from '../model';

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
      const blob = await apiDownload(`/workorders/${document.workOrderID}/documents/${document.documentID}/download`);
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Documents</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Browse uploaded work order documents.</Typography>
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document</TableCell>
              <TableCell>Type</TableCell>
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
              <TableRow key={document.documentID}>
                <TableCell>{document.fileName}</TableCell>
                <TableCell>{document.documentType?.replaceAll('_', ' ') || 'Not set'}</TableCell>
                <TableCell>#{document.workOrderID}</TableCell>
                <TableCell>{document.workOrderStatus?.replaceAll('_', ' ') || 'Not set'}</TableCell>
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
              <TableRow>
                <TableCell colSpan={9}>No documents have been uploaded.</TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={9}>Loading documents...</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Documents;
