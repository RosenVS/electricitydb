import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ElectricBolt
} from '@mui/icons-material';
import { statisticsAPI } from '../api/api_account';

const Statistics = () => {
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const data = await statisticsAPI.getStatisticsData();

      setTransactions(data.transactions || []);
      setOrders(data.orders || []);
      setBalance(data.balance);
      setError(null);
    } catch (err) {
      setError('Failed to load statistics data');
      console.error('Statistics error:', err);
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

  // Prepare data for charts
  const prepareTransactionData = () => {
    const buyTransactions = transactions.filter(t => t.transaction_type === 'buy');
    const sellTransactions = transactions.filter(t => t.transaction_type === 'sell');
    
    const totalBuyAmount = buyTransactions.reduce((sum, t) => sum + t.amount_mwh, 0);
    const totalSellAmount = sellTransactions.reduce((sum, t) => sum + t.amount_mwh, 0);
    const totalBuyValue = buyTransactions.reduce((sum, t) => sum + t.total_eur, 0);
    const totalSellValue = sellTransactions.reduce((sum, t) => sum + t.total_eur, 0);
    
    return {
      buyTransactions: buyTransactions.length,
      sellTransactions: sellTransactions.length,
      totalBuyAmount,
      totalSellAmount,
      totalBuyValue,
      totalSellValue,
      netEnergy: totalBuyAmount - totalSellAmount,
      netValue: totalSellValue - totalBuyValue
    };
  };

  const preparePriceData = () => {
    if (transactions.length === 0) return [];
    
    // Group transactions by date and calculate average price
    const groupedByDate = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.created_at).toLocaleDateString('de-DE');
      if (!acc[date]) {
        acc[date] = { date, prices: [], amounts: [] };
      }
      acc[date].prices.push(transaction.price_eur_per_mwh);
      acc[date].amounts.push(transaction.amount_mwh);
      return acc;
    }, {});

    return Object.values(groupedByDate).map(group => ({
      date: group.date,
      avgPrice: group.prices.reduce((sum, price) => sum + price, 0) / group.prices.length,
      totalAmount: group.amounts.reduce((sum, amount) => sum + amount, 0)
    }));
  };

  const prepareOrderStatusData = () => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  const prepareOrderTypeData = () => {
    const buyOrders = orders.filter(order => order.order_type === 'buy').length;
    const sellOrders = orders.filter(order => order.order_type === 'sell').length;

    return [
      { name: 'Buy Orders', value: buyOrders, fill: '#4caf50' },
      { name: 'Sell Orders', value: sellOrders, fill: '#f44336' }
    ];
  };

  const transactionData = prepareTransactionData();
  const priceData = preparePriceData();
  const orderStatusData = prepareOrderStatusData();
  const orderTypeData = prepareOrderTypeData();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
      <Typography variant="h4" component="h1" gutterBottom>
        Trading Statistics
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
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
                {formatEnergy(transactionData.totalBuyAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(transactionData.totalBuyValue)}
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
                {formatEnergy(transactionData.totalSellAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(transactionData.totalSellValue)}
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
              <Typography variant="h4" color={transactionData.netEnergy >= 0 ? 'success.main' : 'error.main'}>
                {formatEnergy(Math.abs(transactionData.netEnergy))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {transactionData.netEnergy >= 0 ? 'Net Bought' : 'Net Sold'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ElectricBolt color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Current Balance
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {formatEnergy(balance?.energy_mwh || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(balance?.money_eur || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Paper sx={{ p: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="Price Trends" />
          <Tab label="Order Distribution" />
          <Tab label="Transaction Activity" />
        </Tabs>

        {/* Price Trends Chart */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Price Trends Over Time
            </Typography>
            {priceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'avgPrice' ? formatCurrency(value) : formatEnergy(value),
                      name === 'avgPrice' ? 'Average Price' : 'Total Amount'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgPrice" 
                    stroke="#8884d8" 
                    name="Average Price"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No transaction data available for price trends
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Order Distribution Charts */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No order data available
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Order Type Distribution
              </Typography>
              {orderTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={orderTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No order data available
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        {/* Transaction Activity Chart */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Transaction Activity
            </Typography>
            {transactions.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={transactions.slice(-20)}> {/* Show last 20 transactions */}
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="created_at" tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE')} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'amount_mwh' ? formatEnergy(value) : formatCurrency(value),
                      name === 'amount_mwh' ? 'Amount' : 'Price'
                    ]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('de-DE')}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="amount_mwh" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Amount"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price_eur_per_mwh" 
                    stackId="2" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    name="Price"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No transaction data available
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Statistics; 