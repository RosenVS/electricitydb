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
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Edit,
  Delete,
  ArrowBack,
  Save,
  Cancel
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ordersAPI } from '../api/api_account';

const OrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrder(id);
      setOrder(response);
      setEditForm({
        amount_mwh: response.amount_mwh,
        price_eur_per_mwh: response.price_eur_per_mwh
      });
      setError(null);
    } catch (err) {
      setError('Failed to load order details');
      console.error('Order detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    // Ensure edit form is properly initialized
    setEditForm({
      amount_mwh: order.amount_mwh,
      price_eur_per_mwh: order.price_eur_per_mwh
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updates = {};
      if (editForm.amount_mwh !== order.amount_mwh) {
        updates.amount_mwh = parseFloat(editForm.amount_mwh);
      }
      if (editForm.price_eur_per_mwh !== order.price_eur_per_mwh) {
        updates.price_eur_per_mwh = parseFloat(editForm.price_eur_per_mwh);
      }

      await ordersAPI.updateOrder(id, updates);
      setEditMode(false);
      fetchOrder(); // Refresh order data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditForm({
      amount_mwh: order.amount_mwh,
      price_eur_per_mwh: order.price_eur_per_mwh
    });
  };

  const handleDelete = async () => {
    try {
      await ordersAPI.deleteOrder(id);
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete order');
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Order not found
        </Alert>
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
            Order #{order.id}
          </Typography>
        </Box>
        {order.status === 'open' && !editMode && (
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </Box>
        )}
        {editMode && (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Save'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Order Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Order Type
                  </Typography>
                  <Chip
                    icon={order.order_type === 'buy' ? <TrendingDown /> : <TrendingUp />}
                    label={order.order_type}
                    color={getOrderTypeColor(order.order_type)}
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      type="number"
                      value={editForm.amount_mwh}
                      onChange={(e) => setEditForm({...editForm, amount_mwh: parseFloat(e.target.value) || 0})}
                      inputProps={{ min: 0, step: 0.1 }}
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Typography variant="h6">
                      {formatEnergy(order.amount_mwh)}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Price per MWh
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      type="number"
                      value={editForm.price_eur_per_mwh}
                      onChange={(e) => setEditForm({...editForm, price_eur_per_mwh: parseFloat(e.target.value) || 0})}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Typography variant="h6">
                      {formatCurrency(order.price_eur_per_mwh)}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {formatCurrency(order.amount_mwh * order.price_eur_per_mwh)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Timeline */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Timeline
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {formatDate(order.created_at)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {formatDate(order.updated_at)}
                </Typography>
              </Box>
              {order.user_name && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created By
                    </Typography>
                    <Typography variant="body1">
                      {order.user_name}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {order.order_type} order?
          </Typography>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Amount: {formatEnergy(order.amount_mwh)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Price: {formatCurrency(order.price_eur_per_mwh)}/MWh
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderDetail; 