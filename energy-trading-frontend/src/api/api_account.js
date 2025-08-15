import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// Request interceptor to add auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API functions
export const authAPI = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

// Balance API functions
export const balanceAPI = {
  // Get user balance
  getBalance: async () => {
    const response = await api.get('/balance');
    return response.data;
  }
};

// Orders API functions
export const ordersAPI = {
  // Get all orders
  getAllOrders: async () => {
    console.log('API: Getting all orders');
    const response = await api.get('/orders');
    console.log('API: All orders response:', response.data);
    return response.data;
  },

  // Get orders with filters
  getOrders: async (filters = {}) => {
    console.log('API: Getting orders with filters:', filters);
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const url = params.toString() ? `/orders?${params.toString()}` : '/orders';
    console.log('API: Orders URL:', url);
    
    const response = await api.get(url);
    console.log('API: Orders response:', response.data);
    return response.data;
  },

  // Get specific order by ID
  getOrder: async (id) => {
    console.log('API: Getting order by ID:', id);
    const response = await api.get(`/orders/${id}`);
    console.log('API: Order response:', response.data);
    return response.data;
  },

  // Create new order
  createOrder: async (orderData) => {
    console.log('API: Creating order:', orderData);
    const response = await api.post('/orders', orderData);
    console.log('API: Create order response:', response.data);
    return response.data;
  },

  // Update order
  updateOrder: async (id, updates) => {
    console.log('API: Updating order:', id, updates);
    const response = await api.put(`/orders/${id}`, updates);
    console.log('API: Update order response:', response.data);
    return response.data;
  },

  // Delete order
  deleteOrder: async (id) => {
    console.log('API: Deleting order:', id);
    const response = await api.delete(`/orders/${id}`);
    console.log('API: Delete order response:', response.data);
    return response.data;
  },

  // Get sell orders (market orders)
  getSellOrders: async () => {
    console.log('API: Getting sell orders');
    const response = await api.get('/orders/sell');
    console.log('API: Sell orders response:', response.data);
    return response.data;
  }
};

// Transactions API functions
export const transactionsAPI = {
  // Get all transactions
  getAllTransactions: async () => {
    const response = await api.get('/transactions');
    return response.data;
  }
};

// Dashboard API functions
export const dashboardAPI = {
  // Get all dashboard data in parallel
  getDashboardData: async () => {
    console.log('API: Getting dashboard data...');
    
    try {
      const [balanceRes, transactionsRes, ordersRes, marketRes] = await Promise.all([
        api.get('/balance'),
        api.get('/transactions'),
        api.get('/orders'),
        api.get('/orders/sell')
      ]);

      const data = {
        balance: balanceRes.data,
        transactions: transactionsRes.data || [],
        orders: ordersRes.data || [],
        marketOrders: marketRes.data || []
      };

      console.log('API: Dashboard data received:', data);
      return data;
    } catch (error) {
      console.error('API: Dashboard data error:', error);
      throw error;
    }
  }
};

// Statistics API functions
export const statisticsAPI = {
  // Get statistics data
  getStatisticsData: async () => {
    const [transactionsRes, ordersRes, balanceRes] = await Promise.all([
      api.get('/transactions'),
      api.get('/orders'),
      api.get('/balance')
    ]);

    return {
      transactions: transactionsRes.data || [],
      orders: ordersRes.data || [],
      balance: balanceRes.data
    };
  }
};

// Export the base api instance for custom requests
export default api;
