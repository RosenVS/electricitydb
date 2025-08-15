import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Market from "./pages/Market";
import Transactions from "./pages/Transactions";
import CreateOrder from "./pages/CreateOrder";
import OrderDetail from "./pages/OrderDetail";
import Statistics from "./pages/Statistics";
import FulfilledOrders from "./pages/FulfilledOrders";
import Navbar from "./components/Navbar";
import AuthDebug from "./components/AuthDebug";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/orders" element={isAuthenticated ? <Orders /> : <Navigate to="/login" />} />
        <Route path="/market" element={<Market />} />
        <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/login" />} />
        <Route path="/create-order" element={isAuthenticated ? <CreateOrder /> : <Navigate to="/login" />} />
        <Route path="/orders/:id" element={isAuthenticated ? <OrderDetail /> : <Navigate to="/login" />} />
        <Route path="/statistics" element={isAuthenticated ? <Statistics /> : <Navigate to="/login" />} />
        <Route path="/fulfilled-orders" element={isAuthenticated ? <FulfilledOrders /> : <Navigate to="/login" />} />
        <Route path="/debug" element={<AuthDebug />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
