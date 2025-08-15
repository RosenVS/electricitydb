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
  TrendingDown,
  FilterList,
  Refresh,
  Visibility,
  Download,
  Analytics,
  AccountBalance
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { transactionsAPI } from '../api/api_account';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const response = await transactionsAPI.getAllTransactions();
      setTransactions(response || []);
      setError(null);
    } catch (err) {
      setError('Failed to load transactions');
      console.error('Transactions error:', err);
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

  const getTransactionStats = () => {
    if (transactions.length === 0) return null;
    
    const buyTransactions = transactions.filter(t => t.transaction_type === 'buy');
    const sellTransactions = transactions.filter(t => t.transaction_type === 'sell');
    
    const totalBuyAmount = buyTransactions.reduce((sum, t) => sum + t.amount_mwh, 0);
    const totalSellAmount = sellTransactions.reduce((sum, t) => sum + t.amount_mwh, 0);
    const totalBuyValue = buyTransactions.reduce((sum, t) => sum + t.total_eur, 0);
    const totalSellValue = sellTransactions.reduce((sum, t) => sum + t.total_eur, 0);
    
    const avgBuyPrice = buyTransactions.length > 0 ? totalBuyValue / totalBuyAmount : 0;
    const avgSellPrice = sellTransactions.length > 0 ? totalSellValue / totalSellAmount : 0;
    
    return {
      totalTransactions: transactions.length,
      buyTransactions: buyTransactions.length,
      sellTransactions: sellTransactions.length,
      totalBuyAmount,
      totalSellAmount,
      totalBuyValue,
      totalSellValue,
      avgBuyPrice,
      avgSellPrice,
      netEnergy: totalBuyAmount - totalSellAmount,
      netValue: totalSellValue - totalBuyValue
    };
  };

  const filteredTransactions = transactions.filter(transaction => {
    const amount = transaction.amount_mwh;
    const price = transaction.price_eur_per_mwh;
    const date = new Date(transaction.created_at);
    
    const matchesType = !filterType || transaction.transaction_type === filterType;
    const matchesMinAmount = !minAmount || amount >= parseFloat(minAmount);
    const matchesMaxAmount = !maxAmount || amount <= parseFloat(maxAmount);
    const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);
    const matchesDateFrom = !dateFrom || date >= new Date(dateFrom);
    const matchesDateTo = !dateTo || date <= new Date(dateTo);
    
    return matchesType && matchesMinAmount && matchesMaxAmount && 
           matchesMinPrice && matchesMaxPrice && matchesDateFrom && matchesDateTo;
  });

  const stats = getTransactionStats();

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
          Transaction History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchTransactions}
        >
          Refresh
        </Button>
      </Box>

      {/* Transaction Statistics */}
      {stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Analytics color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Total Transactions
                  </Typography>
                </Box>
                <Typography variant="h4" component="h2">
                  {stats.totalTransactions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.buyTransactions} buys, {stats.sellTransactions} sells
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
                <Typography variant="h4" component="h2" color="success.main">
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
                <Typography variant="h4" component="h2" color="error.main">
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
                  <AccountBalance color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">
                    Net Position
                  </Typography>
                </Box>
                <Typography variant="h4" component="h2" color={stats.netEnergy >= 0 ? 'success.main' : 'error.main'}>
                  {formatEnergy(Math.abs(stats.netEnergy))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.netEnergy >= 0 ? 'Net Bought' : 'Net Sold'}
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
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={filterType}
                  label="Transaction Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>
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
                label="From Date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilterType('');
                  setMinAmount('');
                  setMaxAmount('');
                  setMinPrice('');
                  setMaxPrice('');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transactions ({filteredTransactions.length})
          </Typography>
          
          {filteredTransactions.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        <Chip
                          icon={transaction.transaction_type === 'buy' ? <TrendingDown /> : <TrendingUp />}
                          label={transaction.transaction_type}
                          color={transaction.transaction_type === 'buy' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatEnergy(transaction.amount_mwh)}</TableCell>
                      <TableCell>{formatCurrency(transaction.price_eur_per_mwh)}/MWh</TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(transaction.total_eur)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell>
                        {transaction.order_id ? (
                          <Chip
                            label={`#${transaction.order_id}`}
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/orders/${transaction.order_id}`)}
                            sx={{ cursor: 'pointer' }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Order Details">
                          <IconButton
                            size="small"
                            disabled={!transaction.order_id}
                            onClick={() => transaction.order_id && navigate(`/orders/${transaction.order_id}`)}
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
                No transactions found
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/create-order')}
              >
                Start Trading
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      {filteredTransactions.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transaction Summary
            </Typography>
            <List>
              {filteredTransactions.slice(0, 5).map((transaction, index) => (
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

export default Transactions; 