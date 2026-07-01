import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { apiFetch } from '../api';
import { useAuth } from './AuthContext';
import { normalizeWorker } from '../model';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    firstName: '',
    lastName: '',
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setProfile({
      displayName: user?.displayName || '',
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  }, [user]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile(current => ({ ...current, [name]: value }));
  };

  const saveProfile = async () => {
    try {
      const updated = await apiFetch(`/workers/${user.workerID}/profile`, {
        method: 'PUT',
        body: JSON.stringify({
          workerDisplayName: profile.displayName.trim(),
          workerEmail: profile.email.trim(),
          workerFName: profile.firstName.trim(),
          workerLName: profile.lastName.trim(),
        }),
      });
      const normalized = normalizeWorker(updated);
      updateUser({
        displayName: normalized.displayName,
        email: normalized.email,
        firstName: normalized.firstName,
        lastName: normalized.lastName,
      });
      setMessage({ severity: 'success', text: 'Profile updated.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    }
  };

  const resetPassword = async () => {
    try {
      await apiFetch(`/workers/${user.workerID}/password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword: password }),
      });
      setPassword('');
      setMessage({ severity: 'success', text: 'Password updated.' });
    } catch (error) {
      setMessage({ severity: 'error', text: error.message });
    }
  };

  return (
    <Box sx={{ p: 3, pb: 8 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Settings</Typography>
      <Typography variant="h6">{user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}</Typography>
      <Typography color="text.secondary">{user?.username}</Typography>
      <Typography sx={{ mb: 3 }}>{user?.isAdmin ? 'Administrator' : 'Inspector'}</Typography>
      {message && <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Profile</Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 180 }}>Username</TableCell>
                    <TableCell>
                      <TextField value={user?.username || ''} fullWidth disabled />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Display Name</TableCell>
                    <TableCell>
                      <TextField name="displayName" value={profile.displayName} onChange={handleProfileChange} fullWidth />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell>
                      <TextField name="email" type="email" value={profile.email} onChange={handleProfileChange} fullWidth />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>First Name</TableCell>
                    <TableCell>
                      <TextField name="firstName" value={profile.firstName} onChange={handleProfileChange} fullWidth />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Last Name</TableCell>
                    <TableCell>
                      <TextField name="lastName" value={profile.lastName} onChange={handleProfileChange} fullWidth />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              disabled={!profile.email.trim() || !profile.firstName.trim() || !profile.lastName.trim()}
              onClick={saveProfile}
            >
              Save Profile
            </Button>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Password Reset</Typography>
            {user?.isAdmin ? (
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 180 }}>New Password</TableCell>
                      <TableCell>
                        <TextField
                          label="New password"
                          type="password"
                          value={password}
                          onChange={event => setPassword(event.target.value)}
                          fullWidth
                          helperText="The backend requires at least 8 characters."
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                Ask an administrator to reset your password.
              </Alert>
            )}
            {user?.isAdmin && (
              <Button variant="contained" sx={{ mt: 2 }} disabled={password.length < 8} onClick={resetPassword}>
                Reset Password
              </Button>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600, mb: 2 }}>Profile Information</Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 180 }}>Display Name</TableCell>
                    <TableCell>{user?.displayName || 'Not set'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                    <TableCell>{user?.username || 'Not set'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell>{user?.email || 'Not set'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>First Name</TableCell>
                    <TableCell>{user?.firstName || 'Not set'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Last Name</TableCell>
                    <TableCell>{user?.lastName || 'Not set'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell>{user?.isAdmin ? 'Administrator' : 'Inspector'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
