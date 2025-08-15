import { authAPI } from '../api/api_account';

export const validateToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('validateToken: No token found');
    return false;
  }

  try {
    console.log('validateToken: Attempting to validate token');
    // Import here to avoid circular dependency
    const { authAPI } = await import('../api/api_account');
    await authAPI.getProfile();
    console.log('validateToken: Token is valid');
    return true;
  } catch (err) {
    console.log('validateToken: Token validation failed:', err.message);
    if (err.response?.status === 401) {
      console.log('validateToken: 401 error, removing token');
      localStorage.removeItem('token');
      return false;
    }
    // For errors other than 401, we assume the token is still valid
    console.log('validateToken: Non-401 error, assuming token is valid');
    return true;
  }
};

export const clearToken = () => {
  localStorage.removeItem('token');
}; 