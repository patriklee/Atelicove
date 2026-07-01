import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
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

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.docx,.xlsx,.txt';

const formatFileSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const WorkOrderDocuments = ({ workOrderID, canManage = false }) => {
  const inputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadDocuments = () => {
    setLoading(true);
    apiFetch(`/workorders/${workOrderID}/documents`)
      .then(setDocuments)
      .catch(error => setMessage({ severity: 'error', text: error.message }))
      .finally(() => setLoading(false));
  };

  useEffect(loadDocuments, [workOrderID]);

  const uploadDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setMessage({ severity: 'error', text: 'Documents must be 10 MB or smaller.' });
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setBusy(true);
    setMessage(null);
    try {
      await apiFetch(`/workorders/${workOrderID}/documents`, {
        method: 'POST',
        body: formData,
      });
      setMessage({ severity: 'success', text: 'Document uploaded.' });
      loadDocuments();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  const downloadDocument = async (document) => {
    setBusy(true);
    setMessage(null);
    try {
      const blob = await apiDownload(`/workorders/${workOrderID}/documents/${document.documentID}/download`);
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

  const deleteDocument = async (document) => {
    if (!window.confirm(`Delete ${document.fileName}?`)) return;

    setBusy(true);
    setMessage(null);
    try {
      await apiFetch(`/workorders/${workOrderID}/documents/${document.documentID}`, { method: 'DELETE' });
      setMessage({ severity: 'success', text: 'Document deleted.' });
      loadDocuments();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 1 }}>
        <Typography variant="h6">Files</Typography>
        {canManage && (
          <Box>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              hidden
              onChange={uploadDocument}
            />
            <Button variant="contained" disabled={busy} onClick={() => inputRef.current?.click()}>
              Upload File
            </Button>
          </Box>
        )}
      </Stack>

      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map(document => (
              <TableRow key={document.documentID}>
                <TableCell>
                  <Button size="small" onClick={() => downloadDocument(document)} disabled={busy}>
                    {document.fileName}
                  </Button>
                </TableCell>
                <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                <TableCell>{document.uploadedBy || 'Not recorded'}</TableCell>
                <TableCell>{formatDateTime(document.createdAt)}</TableCell>
                <TableCell align="right">
                  {canManage && (
                    <Button size="small" color="error" disabled={busy} onClick={() => deleteDocument(document)}>
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!loading && !documents.length && (
              <TableRow>
                <TableCell colSpan={5}>No files are attached to this work order.</TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={5}>Loading files...</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkOrderDocuments;
