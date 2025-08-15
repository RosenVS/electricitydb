import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ElectricBolt,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { balanceAPI, ordersAPI } from '../api/api_account';


const CreateOrder = () => {
  const [orderType, setOrderType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [balance, setBalance] = useState(null);
  const [marketPrices, setMarketPrices] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = localStorage.getItem('token');

  useEffect(() => {
    // Set initial values from URL params
    const typeFromUrl = searchParams.get('type');
    const priceFromUrl = searchParams.get('price');
    
    if (typeFromUrl) setOrderType(typeFromUrl);
    if (priceFromUrl) setPrice(priceFromUrl);
    
    fetchBalance();
    fetchMarketPrices();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await balanceAPI.getBalance();
      setBalance(response);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const fetchMarketPrices = async () => {
    try {
      const response = await ordersAPI.getSellOrders();
      setMarketPrices(response || []);
    } catch (err) {
      console.error('Failed to fetch market prices:', err);
      setMarketPrices([]);
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

  const calculateTotalCost = () => {
    const amountNum = parseFloat(amount) || 0;
    const priceNum = parseFloat(price) || 0;
    return amountNum * priceNum;
  };

  const validateForm = () => {
    if (!amount || !price) {
      setError('Please fill in all fields');
      return false;
    }

    const amountNum = parseFloat(amount);
    const priceNum = parseFloat(price);

    if (amountNum <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    if (priceNum <= 0) {
      setError('Price must be greater than 0');
      return false;
    }

    // Check balance constraints
    if (orderType === 'buy') {
      const totalCost = calculateTotalCost();
      if (balance && totalCost > balance.money_eur) {
        setError(`Insufficient funds. You have ${formatCurrency(balance.money_eur)} but need ${formatCurrency(totalCost)}`);
        return false;
      }
    } else if (orderType === 'sell') {
      if (balance && amountNum > balance.energy_mwh) {
        setError(`Insufficient energy. You have ${formatEnergy(balance.energy_mwh)} but want to sell ${formatEnergy(amountNum)}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const orderData = {
        order_type: orderType,
        amount_mwh: parseFloat(amount),
        price_eur_per_mwh: parseFloat(price)
      };

      const response = await ordersAPI.createOrder(orderData);
      
      setSuccess(`Order created successfully! Order ID: ${response.id}`);
      
      // Reset form
      setAmount('');
      setPrice('');
      setActiveStep(0);
      
      // Refresh balance
      fetchBalance();
      
      // Navigate to orders page after a delay
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const getMarketPriceSuggestion = () => {
    if (!marketPrices || marketPrices.length === 0) return null;
    
    const prices = (marketPrices || []).map(order => order.price_eur_per_mwh);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return { avgPrice, minPrice, maxPrice };
  };

  const priceSuggestion = getMarketPriceSuggestion();

  const steps = [
    {
      label: 'Order Type',
      description: 'Choose whether you want to buy or sell energy'
    },
    {
      label: 'Order Details',
      description: 'Enter the amount and price for your order'
    },
    {
      label: 'Review & Confirm',
      description: 'Review your order details and confirm'
    }
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Create {orderType === 'buy' ? 'Buy' : 'Sell'} Order
      </Typography>

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {/* Stepper */}
              <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel>{step.label}</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>

              <form onSubmit={handleSubmit}>
                {/* Step 1: Order Type */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Order Type
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel>Order Type</InputLabel>
                    <Select
                      value={orderType}
                      label="Order Type"
                      onChange={(e) => {
                        setOrderType(e.target.value);
                        setActiveStep(1);
                      }}
                    >
                      <MenuItem value="buy">
                        <Box display="flex" alignItems="center" gap={1}>
                          <TrendingDown color="success" />
                          Buy Energy
                        </Box>
                      </MenuItem>
                      <MenuItem value="sell">
                        <Box display="flex" alignItems="center" gap={1}>
                          <TrendingUp color="error" />
                          Sell Energy
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Step 2: Order Details */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Order Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount (MWh)"
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setActiveStep(2);
                        }}
                        inputProps={{ min: 0, step: 0.1 }}
                        helperText={`Available: ${orderType === 'buy' ? 
                          (balance ? formatCurrency(balance.money_eur) : 'Loading...') : 
                          (balance ? formatEnergy(balance.energy_mwh) : 'Loading...')}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Price (€/MWh)"
                        type="number"
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          setActiveStep(2);
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                        helperText={priceSuggestion ? 
                          `Market range: ${formatCurrency(priceSuggestion.minPrice)} - ${formatCurrency(priceSuggestion.maxPrice)}` : 
                          'Enter your desired price'}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Step 3: Review */}
                {amount && price && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Order Summary
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Order Type
                          </Typography>
                          <Chip
                            icon={orderType === 'buy' ? <TrendingDown /> : <TrendingUp />}
                            label={orderType === 'buy' ? 'Buy' : 'Sell'}
                            color={orderType === 'buy' ? 'success' : 'error'}
                            sx={{ mt: 1 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Amount
                          </Typography>
                          <Typography variant="h6">
                            {formatEnergy(parseFloat(amount) || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Price per MWh
                          </Typography>
                          <Typography variant="h6">
                            {formatCurrency(parseFloat(price) || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Value
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(calculateTotalCost())}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}

                {/* Submit Button */}
                <Box display="flex" gap={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || !amount || !price}
                    sx={{ minWidth: 150 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create Order'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/orders')}
                  >
                    Cancel
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Balance Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Balance
              </Typography>
              {balance ? (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccountBalance color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h5" color="primary">
                      {formatCurrency(balance.money_eur)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <ElectricBolt color="success" sx={{ mr: 1 }} />
                    <Typography variant="h5" color="success.main">
                      {formatEnergy(balance.energy_mwh)}
                    </Typography>
                  </Box>
                </>
              ) : (
                <CircularProgress size={24} />
              )}
            </CardContent>
          </Card>

          {/* Market Information */}
          {priceSuggestion && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Market Information
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <Info color="info" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Average Price
                  </Typography>
                </Box>
                <Typography variant="h6" color="info.main" gutterBottom>
                  {formatCurrency(priceSuggestion.avgPrice)}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Price Range: {formatCurrency(priceSuggestion.minPrice)} - {formatCurrency(priceSuggestion.maxPrice)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available Orders: {marketPrices ? marketPrices.length : 0}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tips
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Buy orders are automatically executed against available sell orders
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Sell orders are placed in the market for others to buy
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Check market prices to set competitive rates
                </Typography>
                <Typography component="li" variant="body2">
                  You can edit or cancel open orders anytime
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CreateOrder; 