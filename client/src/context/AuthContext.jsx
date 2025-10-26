import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// --- GET API BASE URL FROM VERCEL ENVIRONMENT VARIABLE ---
// Vercel sets this variable (VITE_API_URL) to https://vigil-oq6q.onrender.com/
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // In a real app, you'd verify the token with the backend
          // For now, we'll just set a mock user
          setUser({
            id: '1',
            email: 'demo@vigil.ai',
            name: 'Demo User'
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Try to call the actual backend
      try {
        // --- FIXED: Use API_URL here instead of hardcoded localhost ---
        const response = await axios.post(`${API_URL}/api/auth/login`, {
          email,
          password
        });
        
        const { token: authToken } = response.data;
        setToken(authToken);
        setUser({ email, id: '1', name: email.split('@')[0] });
        localStorage.setItem('token', authToken);
        
        return { success: true };
      } catch (backendError) {
        return { 
          success: false, 
          error: 'Invalid credentials. Please check your email and password.' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    try {
      setLoading(true);
      // --- FIXED: Use API_URL here instead of hardcoded localhost ---
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password
      });
      
      const { token: authToken } = response.data;
      setToken(authToken);
      setUser({ email, id: '1', name: email.split('@')[0] });
      localStorage.setItem('token', authToken);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
