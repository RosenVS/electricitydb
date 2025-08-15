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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  TrendingUp,
  Person,
  Sort,
  FilterList,
  Refresh,
  Visibility,
  ShoppingCart,
  TrendingDown
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../api/api_account';

const Market = () => {
  const token = localStorage.getItem('token');

  const [marketOrders, setMarketOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMarketOrders();
  }, []);

  const fetchMarketOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getSellOrders();
      // Filter out user's own orders from market view (only if user is logged in)
      if (token) {
        try {
          const userOrders = await ordersAPI.getAllOrders();
          const userOrderIds = new Set((userOrders || []).map(order => order.id));
          const filteredOrders = (response || []).filter(order => order && !userOrderIds.has(order.id));
          setMarketOrders(filteredOrders);
        } catch (userOrdersError) {
          // If user orders fetch fails, show all market orders
          setMarketOrders(response || []);
        }
      } else {
        // If no token, show all market orders
        setMarketOrders(response || []);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load market orders');
      console.error('Market error:', err);
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

  const filteredAndSortedOrders = (marketOrders || [])
    .filter(order => {
      const price = order.price_eur_per_mwh;
      const amount = order.amount_mwh;
      
      const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
      const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);
      const matchesMinAmount = !minAmount || amount >= parseFloat(minAmount);
      const matchesMaxAmount = !maxAmount || amount <= parseFloat(maxAmount);
      
      return matchesMinPrice && matchesMaxPrice && matchesMinAmount && matchesMaxAmount;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price_eur_per_mwh;
          bValue = b.price_eur_per_mwh;
          break;
        case 'amount':
          aValue = a.amount_mwh;
          bValue = b.amount_mwh;
          break;
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a.price_eur_per_mwh;
          bValue = b.price_eur_per_mwh;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getMarketStats = () => {
    if (!marketOrders || marketOrders.length === 0) return null;
    
    const prices = (marketOrders || []).map(order => order.price_eur_per_mwh);
    const amounts = (marketOrders || []).map(order => order.amount_mwh);
    
    return {
      totalOrders: marketOrders.length,
      totalEnergy: amounts.reduce((sum, amount) => sum + amount, 0),
      avgPrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  };

  const stats = getMarketStats();

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
          Energy Market
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchMarketOrders}
        >
          Refresh Market
        </Button>
      </Box>

      {/* Market Statistics */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Orders
                </Typography>
                <Typography variant="h4" component="h2">
                  {stats.totalOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Energy
                </Typography>
                <Typography variant="h4" component="h2">
                  {formatEnergy(stats.totalEnergy)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Price
                </Typography>
                <Typography variant="h4" component="h2">
                  {formatCurrency(stats.avgPrice)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Price Range
                </Typography>
                <Typography variant="h6" component="h2">
                  {formatCurrency(stats.minPrice)} - {formatCurrency(stats.maxPrice)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters & Sorting
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Min Price (€/MWh)"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Max Price (€/MWh)"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Min Amount (MWh)"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Max Amount (MWh)"
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="amount">Amount</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  label="Order"
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box mt={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setMinPrice('');
                setMaxPrice('');
                setMinAmount('');
                setMaxAmount('');
                setSortBy('price');
                setSortOrder('asc');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Market Orders */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Available Sell Orders ({filteredAndSortedOrders.length})
          </Typography>
          
          {filteredAndSortedOrders.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Seller</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person color="action" />
                          <Typography variant="body2">
                            {order.user_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatEnergy(order.amount_mwh)}</TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(order.price_eur_per_mwh)}/MWh
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(order.amount_mwh * order.price_eur_per_mwh)}
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
                          <Tooltip title="Create Buy Order">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/create-order?type=buy&price=${order.price_eur_per_mwh}`)}
                            >
                              <ShoppingCart />
                            </IconButton>
                          </Tooltip>
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
                No sell orders available in the market
              </Typography>
              <Button
                variant="contained"
                startIcon={<TrendingUp />}
                onClick={() => navigate('/create-order?type=sell')}
              >
                Create First Sell Order
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Market Activity Summary */}
      {filteredAndSortedOrders.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Market Activity
            </Typography>
            <List>
              {filteredAndSortedOrders.slice(0, 5).map((order, index) => (
                <React.Fragment key={order.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <TrendingUp color="error" fontSize="small" />
                          <Typography variant="body1">
                            {order.user_name} listed {formatEnergy(order.amount_mwh)} for sale
                          </Typography>
                        </Box>
                      }
                      secondary={`${formatCurrency(order.price_eur_per_mwh)}/MWh • ${formatDate(order.created_at)}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={formatCurrency(order.price_eur_per_mwh)}
                        color="primary"
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < 4 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Market; 