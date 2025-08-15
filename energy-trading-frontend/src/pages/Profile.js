import React, { useEffect, useState } from "react";
import { Container, Typography, Box, CircularProgress, Alert, Button, Paper } from "@mui/material";
import { authAPI } from "../api/api_account";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout, setUserData, user: authUser, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await authAPI.getProfile();
        setProfile(res);
        setUserData(res); // Update the global user data
        console.log('Profile fetched successfully:', res);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError("Failed to load profile, please login again.");
        logout();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setError("Not authenticated");
      setLoading(false);
    }
  }, [navigate, isAuthenticated, setUserData, logout]);

  if (error) return <Container maxWidth="sm"><Alert severity="error">{error}</Alert></Container>;
  if (loading)
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        
        {/* Debug Info */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>Debug Information</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Auth State:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Auth User:</strong> {authUser ? JSON.stringify(authUser) : 'None'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Profile Data:</strong> {profile ? JSON.stringify(profile) : 'None'}
          </Typography>
        </Paper>

        {profile && (
          <>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>User ID:</strong> {profile.user_id}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Energy (MWh):</strong> {profile.energy_mwh}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              <strong>Money (€):</strong> {profile.money_eur}
            </Typography>
          </>
        )}
        
        <Box display="flex" gap={2}>
          <Button variant="contained" color="primary" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
          <Button variant="outlined" color="error" onClick={() => {
            logout();
            navigate("/login");
          }}>
            Logout
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
