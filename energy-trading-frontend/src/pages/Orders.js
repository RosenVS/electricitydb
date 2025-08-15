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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Refresh,
  TrendingUp,
  TrendingDown,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI } from '../api/api_account';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('open'); // Default to show only open orders
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();

  console.log('Orders component - Auth state:', { isAuthenticated, user: !!user, token: !!token });

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setError('Not authenticated');
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (filterType) filters.type = filterType;

      console.log('Fetching orders with filters:', filters);
      console.log('Current token:', localStorage.getItem('token'));
      console.log('Auth context token:', token);
      
      const response = await ordersAPI.getOrders(filters);
      console.log('Orders API response:', response);
      
      setOrders(response || []);
      setError(null);
    } catch (err) {
      console.error('Orders fetch error:', err);
      console.error('Error response:', err.response);
      setError(`Failed to load orders: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      await ordersAPI.deleteOrder(selectedOrder.id);
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      setError('Failed to delete order');
      console.error('Delete error:', err);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'primary';
      case 'completed': return 'success';
      case 'canceled': return 'error';
      default: return 'default';
    }
  };

  const getOrderTypeColor = (type) => {
    return type === 'buy' ? 'success' : 'error';
  };

  const filteredOrders = orders.filter(order => {
    const matchesType = !filterType || order.order_type === filterType;
    const matchesStatus = !filterStatus || order.status === filterStatus;
    const matchesSearch = !searchTerm || 
      order.id.toString().includes(searchTerm) ||
      order.price_eur_per_mwh.toString().includes(searchTerm) ||
      order.amount_mwh.toString().includes(searchTerm);
    
    return matchesType && matchesStatus && matchesSearch;
  });

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
          My Orders
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchOrders}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<CheckCircle />}
            onClick={() => navigate('/fulfilled-orders')}
          >
            Fulfilled Orders
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/create-order')}
          >
            Create Order
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, price, or amount..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={filterType}
                  label="Order Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="canceled">Canceled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilterType('');
                  setFilterStatus('');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Orders ({filteredOrders.length})
          </Typography>
          
          {filteredOrders.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
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
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {order.status === 'open' && (
                            <>
                              <Tooltip title="Edit Order">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/orders/${order.id}/edit`)}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Order">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No orders found
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/create-order')}
              >
                Create Your First Order
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {selectedOrder?.order_type} order?
          </Typography>
          {selectedOrder && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                Amount: {formatEnergy(selectedOrder.amount_mwh)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Price: {formatCurrency(selectedOrder.price_eur_per_mwh)}/MWh
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteOrder} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/create-order')}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default Orders; 