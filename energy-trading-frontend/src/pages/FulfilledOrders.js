import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Visibility,
  Refresh,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../api/api_account';

const FulfilledOrders = () => {
  const [fulfilledOrders, setFulfilledOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchFulfilledOrders();
  }, []);

  const fetchFulfilledOrders = async () => {
    try {
      setLoading(true);

      const response = await ordersAPI.getAllOrders();
      // Filter for completed orders
      const completed = (response || []).filter(order => order.status === 'completed');
      setFulfilledOrders(completed);
      setError(null);
    } catch (err) {
      setError('Failed to load fulfilled orders');
      console.error('Fulfilled orders error:', err);
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

  const getOrderTypeColor = (type) => {
    return type === 'buy' ? 'success' : 'error';
  };

  const getFulfillmentStats = () => {
    if (fulfilledOrders.length === 0) return null;
    
    const buyOrders = fulfilledOrders.filter(order => order.order_type === 'buy');
    const sellOrders = fulfilledOrders.filter(order => order.order_type === 'sell');
    
    const totalBuyAmount = buyOrders.reduce((sum, order) => sum + order.amount_mwh, 0);
    const totalSellAmount = sellOrders.reduce((sum, order) => sum + order.amount_mwh, 0);
    const totalBuyValue = buyOrders.reduce((sum, order) => sum + (order.amount_mwh * order.price_eur_per_mwh), 0);
    const totalSellValue = sellOrders.reduce((sum, order) => sum + (order.amount_mwh * order.price_eur_per_mwh), 0);
    
    return {
      totalOrders: fulfilledOrders.length,
      buyOrders: buyOrders.length,
      sellOrders: sellOrders.length,
      totalBuyAmount,
      totalSellAmount,
      totalBuyValue,
      totalSellValue
    };
  };

  const stats = getFulfillmentStats();

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
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/orders')}
          >
            Back to Orders
          </Button>
          <Typography variant="h4" component="h1">
            Fulfilled Orders
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchFulfilledOrders}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Total Fulfilled
                  </Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {stats.totalOrders}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.buyOrders} buys, {stats.sellOrders} sells
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingDown color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Total Bought
                  </Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {formatEnergy(stats.totalBuyAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(stats.totalBuyValue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUp color="error" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Total Sold
                  </Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {formatEnergy(stats.totalSellAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(stats.totalSellValue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircle color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Completion Rate
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary.main">
                  {fulfilledOrders.length > 0 ? '100%' : '0%'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All orders completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Fulfilled Orders Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Fulfilled Orders ({fulfilledOrders.length})
          </Typography>
          
          {fulfilledOrders.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Fulfilled Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fulfilledOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>
                        <Chip
                          icon={order.order_type === 'buy' ? <TrendingDown /> : <TrendingUp />}
                          label={order.order_type}
                          color={getOrderTypeColor(order.order_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatEnergy(order.amount_mwh)}</TableCell>
                      <TableCell>{formatCurrency(order.price_eur_per_mwh)}/MWh</TableCell>
                      <TableCell>
                        {formatCurrency(order.amount_mwh * order.price_eur_per_mwh)}
                      </TableCell>
                      <TableCell>{formatDate(order.updated_at)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No fulfilled orders yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed orders will appear here once they are fulfilled
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default FulfilledOrders; 