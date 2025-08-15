import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  AccountBalance,
  ElectricBolt,
  TrendingUp,
  TrendingDown,
  Visibility,
  Add,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api/api_account';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [marketOrders, setMarketOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { logout, isAuthenticated, user, token } = useAuth();

  console.log('Dashboard component - Auth state:', { isAuthenticated, user: !!user, token: !!token });

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setError('Not authenticated');
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      console.log('Fetching dashboard data...');
      console.log('Current token:', localStorage.getItem('token'));

      // Fetch all data in parallel using the new API
      const data = await dashboardAPI.getDashboardData();
      console.log('Dashboard data received:', data);

      setBalance(data.balance);
      setTransactions((data.transactions || []).slice(0, 5)); // Show only last 5
      setOrders(data.orders || []);
      setMarketOrders((data.marketOrders || []).slice(0, 3)); // Show only top 3
      setError(null);
    } catch (err) {
      console.error('Dashboard error:', err);
      console.error('Error response:', err.response);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        logout();
        navigate('/login');
        return;
      }
      
      setError(`Failed to load dashboard data: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatEnergy = (amount) => {
    return `${amount.toLocaleString('de-DE')} MWh`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDashboardData}
        >
          Refresh
        </Button>
      </Box>

      {/* Balance Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalance color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Account Balance
                </Typography>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                {formatCurrency(balance?.money_eur || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available funds for trading
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ElectricBolt color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Energy Balance
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main" gutterBottom>
                {formatEnergy(balance?.energy_mwh || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available energy for trading
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/create-order')}
              >
                Create Buy Order
              </Button>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/create-order?type=sell')}
              >
                Create Sell Order
              </Button>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => navigate('/market')}
              >
                View Market
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Recent Transactions
                </Typography>
                <Button size="small" onClick={() => navigate('/transactions')}>
                  View All
                </Button>
              </Box>
              {transactions.length > 0 ? (
                <List>
                  {transactions.map((transaction) => (
                    <React.Fragment key={transaction.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              {transaction.transaction_type === 'buy' ? (
                                <TrendingDown color="success" fontSize="small" />
                              ) : (
                                <TrendingUp color="error" fontSize="small" />
                              )}
                              <Typography variant="body1">
                                {transaction.transaction_type === 'buy' ? 'Bought' : 'Sold'} {formatEnergy(transaction.amount_mwh)}
                              </Typography>
                            </Box>
                          }
                          secondary={`${formatCurrency(transaction.price_eur_per_mwh)}/MWh • ${formatDate(transaction.created_at)}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={formatCurrency(transaction.total_eur)}
                            color={transaction.transaction_type === 'buy' ? 'success' : 'error'}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  No transactions yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Active Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Your Active Orders
                </Typography>
                <Button size="small" onClick={() => navigate('/orders')}>
                  View All
                </Button>
              </Box>
              {orders.length > 0 ? (
                <List>
                  {orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={order.order_type}
                                color={order.order_type === 'buy' ? 'success' : 'error'}
                                size="small"
                              />
                              <Typography variant="body1">
                                {formatEnergy(order.amount_mwh)}
                              </Typography>
                            </Box>
                          }
                          secondary={`${formatCurrency(order.price_eur_per_mwh)}/MWh • ${order.status}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  No active orders
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Market Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Market Overview
                </Typography>
                <Button size="small" onClick={() => navigate('/market')}>
                  View Full Market
                </Button>
              </Box>
              {marketOrders.length > 0 ? (
                <Grid container spacing={2}>
                  {marketOrders.map((order) => (
                    <Grid item xs={12} sm={6} md={4} key={order.id}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle2" color="error">
                            Sell Order
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {order.user_name}
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary" gutterBottom>
                          {formatCurrency(order.price_eur_per_mwh)}/MWh
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatEnergy(order.amount_mwh)} available
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  No sell orders in the market
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 