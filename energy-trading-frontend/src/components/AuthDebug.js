import React, { useState } from 'react';
import { Box, Button, Typography, Paper, TextField, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, authAPI } from '../api/api_account';

const AuthDebug = () => {
  const { isAuthenticated, user, token, login, logout, setUserData } = useAuth();
  const [testResult, setTestResult] = useState('');
  const [ordersResult, setOrdersResult] = useState('');
  const [profileResult, setProfileResult] = useState('');

  const testAuth = async () => {
    try {
      setTestResult('Testing authentication...');
      
      // Test login
      const loginRes = await authAPI.login({
        email: 'alice@example.com',
        password: 'secret123'
      });
      
      setTestResult(prev => prev + '\nLogin successful: ' + JSON.stringify(loginRes));
      
      // Test profile
      try {
        const profileRes = await authAPI.getProfile();
        setProfileResult(JSON.stringify(profileRes, null, 2));
        setUserData(profileRes);
      } catch (err) {
        setProfileResult('Profile error: ' + err.message);
      }
      
      // Test orders
      try {
        const ordersRes = await ordersAPI.getOrders();
        setOrdersResult(JSON.stringify(ordersRes, null, 2));
      } catch (err) {
        setOrdersResult('Orders error: ' + err.message);
      }
      
    } catch (err) {
      setTestResult('Test failed: ' + err.message);
    }
  };

  const testOrders = async () => {
    try {
      setOrdersResult('Testing orders API...');
      const orders = await ordersAPI.getOrders();
      setOrdersResult(JSON.stringify(orders, null, 2));
    } catch (err) {
      setOrdersResult('Orders API error: ' + err.message);
    }
  };

  const clearResults = () => {
    setTestResult('');
    setOrdersResult('');
    setProfileResult('');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Authentication Debug</Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Current State:</Typography>
        <Typography variant="body2">Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Typography>
        <Typography variant="body2">Token: {token ? token.substring(0, 20) + '...' : 'None'}</Typography>
        <Typography variant="body2">User: {user ? JSON.stringify(user) : 'None'}</Typography>
        <Typography variant="body2">Local Storage Token: {localStorage.getItem('token') ? 'Present' : 'None'}</Typography>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={testAuth} sx={{ mr: 1 }}>
          Test Full Auth Flow
        </Button>
        <Button variant="outlined" onClick={testOrders} sx={{ mr: 1 }}>
          Test Orders API
        </Button>
        <Button variant="outlined" onClick={clearResults}>
          Clear Results
        </Button>
      </Box>

      {testResult && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" gutterBottom>Test Result:</Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {testResult}
          </Typography>
        </Paper>
      )}

      {profileResult && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'blue.50' }}>
          <Typography variant="subtitle1" gutterBottom>Profile Result:</Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {profileResult}
          </Typography>
        </Paper>
      )}

      {ordersResult && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'green.50' }}>
          <Typography variant="subtitle1" gutterBottom>Orders Result:</Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {ordersResult}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AuthDebug; 