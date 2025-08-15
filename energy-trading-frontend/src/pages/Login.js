import React, { useState } from "react";
import { Container, TextField, Button, Typography, Box, Alert } from "@mui/material";
import { authAPI } from "../api/api_account";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, setUserData } = useAuth();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await authAPI.login(form);
      console.log('Login response:', res);
      
      // Set the token and authentication state
      login(res.token);
      
      // Fetch user profile to set user data
      try {
        const profileRes = await authAPI.getProfile();
        console.log('Profile response:', profileRes);
        setUserData(profileRes);
      } catch (profileErr) {
        console.error('Failed to fetch profile:', profileErr);
        // Don't fail login if profile fetch fails
      }
      
      // Wait a bit for state to update, then navigate
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Login
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled={loading}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled={loading}
          />
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Don't have an account?
            </Typography>
            <Button 
              variant="text" 
              onClick={() => navigate('/register')}
              sx={{ textTransform: 'none' }}
              disabled={loading}
            >
              Create an account
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
}
