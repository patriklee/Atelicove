import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, InputAdornment, CircularProgress } from '@mui/material';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { AppIconButton, icons } from '../shared/icons';
import communityLogo from '../assets/branding/community/atelicove-logo.svg';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const data = await authService.login({ username: username.trim(), password });
            login({
                username: data.workerUser,
                firstName: data.workerFName,
                lastName: data.workerLName,
                displayName: data.workerDisplayName,
                email: data.workerEmail,
                lastLoginAt: data.lastLoginAt,
                isAdmin: data.admin,
                workerID: data.workerID
            });
        } catch (error) {
            setError(error.message || 'Error connecting to server. Please try again later.');
            console.error('Connection error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container
            maxWidth="xs"
            sx={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '100dvh',
                py: { xs: 3, sm: 4 },
            }}
        >
            <Box
                alt="Atelicove — Organize. Build. Grow."
                component="img"
                src={communityLogo}
                sx={{ width: '100%', maxWidth: 240 }}
            />
            <Box 
                component="form" 
                onSubmit={handleLogin}
                sx={{ mt: 1, p: 4, boxShadow: 3, borderRadius: 2, width: '100%' }}
            >
                <Typography variant="h4" gutterBottom align="center">Login</Typography>
                
                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                
                <TextField
                    label="Username"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    inputProps={{ 'data-testid': 'username-input' }}
                />
                
                <TextField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <AppIconButton
                                    icon={showPassword ? icons.hide : icons.view}
                                    label={showPassword ? "hide password" : "show password"}
                                    onClick={togglePasswordVisibility} 
                                    edge="end"
                                    tooltip={false}
                                />
                            </InputAdornment>
                        ),
                        'data-testid': 'password-input'
                    }}
                />
                
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={isLoading || !username || !password}
                >
                    {isLoading ? <CircularProgress size={24} /> : 'Login'}
                </Button>
            </Box>
        </Container>
    );
};

export default LoginPage;
