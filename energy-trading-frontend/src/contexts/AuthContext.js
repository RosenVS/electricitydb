import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateToken } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      console.log('AuthContext: checkAuth called, stored token:', storedToken ? 'Present' : 'None');
      
      if (storedToken) {
        const isValid = await validateToken();
        console.log('AuthContext: Token validation result:', isValid);
        
        if (isValid) {
          setIsAuthenticated(true);
          setToken(storedToken);
          // Don't clear user data if token is still valid
          // If we don't have user data yet, try to fetch it
          if (!user) {
            try {
              // Import here to avoid circular dependency
              const { authAPI } = await import('../api/api_account');
              const profileRes = await authAPI.getProfile();
              setUser(profileRes);
              console.log('AuthContext: User data fetched during auth check:', profileRes);
            } catch (profileErr) {
              console.log('Profile fetch during auth check failed:', profileErr);
              // Don't fail auth check if profile fetch fails
            }
          }
        } else {
          // Token is invalid, clear everything
          console.log('AuthContext: Token invalid, clearing state');
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        }
      } else {
        console.log('AuthContext: No stored token, setting unauthenticated state');
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't clear everything on network errors, just log them
      if (error.response?.status === 401) {
        console.log('AuthContext: 401 error, clearing state');
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken) => {
    console.log('AuthContext: Login called with token:', newToken ? newToken.substring(0, 20) + '...' : 'None');
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    console.log('AuthContext: Authentication state set to true');
    // Note: user data will be set separately via setUserData
  };

  const logout = () => {
    console.log('AuthContext: Logout called');
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    console.log('AuthContext: Authentication state cleared');
  };

  const setUserData = (userData) => {
    console.log('AuthContext: setUserData called with:', userData);
    setUser(userData);
    // Ensure we're authenticated if we have user data
    if (userData && !isAuthenticated) {
      setIsAuthenticated(true);
      console.log('AuthContext: Authentication state set to true due to user data');
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  useEffect(() => {
    checkAuth();

    // Set up periodic token validation
    const interval = setInterval(checkAuth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    token,
    login,
    logout,
    setUserData,
    checkAuth,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
