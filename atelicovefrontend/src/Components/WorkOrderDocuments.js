import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { apiDownload, apiFetch } from '../api';
import { formatDateTime } from '../model';
import TableTitleRow from './TableTitleRow';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.docx,.xlsx,.txt';
const DOCUMENT_TYPES = ['WORK_ORDER', 'RECEIPT', 'OTHER'];

const formatFileSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const WorkOrderDocuments = ({ workOrderID, canManage = false }) => {
  const inputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [pendingDocuments, setPendingDocuments] = useState([]);
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

  const addDocument = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const oversizedFile = files.find(file => file.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      setMessage({ severity: 'error', text: 'Documents must be 10 MB or smaller.' });
      event.target.value = '';
      return;
    }

    setPendingDocuments(current => [
      ...current,
      ...files.map(file => ({
        localID: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${Math.random()}`,
        file,
        documentType: '',
      })),
    ]);
    setMessage(null);
    event.target.value = '';
  };

  const updatePendingDocumentType = (localID, documentType) => {
    setPendingDocuments(current => current.map(document => (
      document.localID === localID ? { ...document, documentType } : document
    )));
  };

  const removePendingDocument = (localID) => {
    setPendingDocuments(current => current.filter(document => document.localID !== localID));
  };

  const uploadDocument = async () => {
    if (!pendingDocuments.length || pendingDocuments.some(document => !document.documentType)) {
      setMessage({ severity: 'error', text: 'Each pending document needs a document type before uploading.' });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      for (const document of pendingDocuments) {
        const formData = new FormData();
        formData.append('file', document.file);
        formData.append('documentType', document.documentType);

        await apiFetch(`/workorders/${workOrderID}/documents`, {
          method: 'POST',
          body: formData,
        });
      }
      setMessage({ severity: 'success', text: 'Documents uploaded.' });
      setPendingDocuments([]);
      loadDocuments();
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    } finally {
      setBusy(false);
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
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableTitleRow title="Documents" colSpan={6} />
            <TableRow>
              <TableCell>File</TableCell>
              <TableCell>Document Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map(document => (
              <TableRow key={document.documentID}>
                <TableCell>{document.fileName}</TableCell>
                <TableCell>{document.documentType?.replaceAll('_', ' ') || 'Not set'}</TableCell>
                <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                <TableCell>{document.uploadedBy || 'Not recorded'}</TableCell>
                <TableCell>{formatDateTime(document.createdAt)}</TableCell>
                <TableCell align="right">
                  <Button size="small" disabled={busy} onClick={() => downloadDocument(document)}>
                    Download
                  </Button>
                  {canManage && (
                    <Button size="small" color="error" disabled={busy} onClick={() => deleteDocument(document)}>
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {pendingDocuments.map(document => (
              <TableRow key={document.localID}>
                <TableCell>{document.file.name}</TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Document Type</InputLabel>
                    <Select
                      value={document.documentType}
                      label="Document Type"
                      onChange={event => updatePendingDocumentType(document.localID, event.target.value)}
                    >
                      {DOCUMENT_TYPES.map(type => (
                        <MenuItem key={type} value={type}>{type.replaceAll('_', ' ')}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>{formatFileSize(document.file.size)}</TableCell>
                <TableCell>Pending upload</TableCell>
                <TableCell>Not uploaded</TableCell>
                <TableCell align="right">
                  <Button size="small" color="warning" disabled={busy} onClick={() => removePendingDocument(document.localID)}>
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !documents.length && !pendingDocuments.length && (
              <TableRow>
                <TableCell colSpan={6}>No documents are attached to this work order.</TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={6}>Loading documents...</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {canManage && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, p: 2, flexWrap: 'wrap' }}>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              hidden
              onChange={addDocument}
            />
            <Button variant="outlined" disabled={busy} onClick={() => inputRef.current?.click()}>
              Add Document
            </Button>
            <Button
              variant="contained"
              disabled={busy || !pendingDocuments.length || pendingDocuments.some(document => !document.documentType)}
              onClick={uploadDocument}
            >
              Upload File
            </Button>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
};

export default WorkOrderDocuments;
