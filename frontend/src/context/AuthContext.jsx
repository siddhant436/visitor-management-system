import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:8000';

  // Initialize auth on mount
  useEffect(() => {
    console.log('🔍 AuthProvider: Initializing auth...');
    initializeAuth();
  }, []); // Only run once on mount

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const residentName = localStorage.getItem('resident_name');
      const residentEmail = localStorage.getItem('resident_email');
      const apartmentNo = localStorage.getItem('apartment_no');

      console.log('📋 Retrieved from localStorage:', {
        token: token ? token.substring(0, 20) + '...' : 'none',
        userId,
        residentName,
        apartmentNo
      });

      if (token && userId) {
        // Set user immediately from localStorage
        const userData = {
          id: userId,
          name: residentName,
          email: residentEmail,
          apartment_no: apartmentNo
        };

        console.log('✅ Setting user from localStorage:', userData);
        setUser(userData);
        setLoading(false);
        return;
      }

      console.log('❌ No stored auth found');
      setLoading(false);
    } catch (err) {
      console.error('❌ Auth initialization failed:', err);
      setLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Logging in with:', { email });

      const response = await axios.post(
        `${API_BASE_URL}/residents/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('✅ Login successful:', response.data);

      if (response.data && response.data.access_token) {
        const { access_token, user_id, name, email: residentEmail, apartment_no } = response.data;

        // Store in localStorage
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_id', user_id);
        localStorage.setItem('resident_name', name);
        localStorage.setItem('resident_email', residentEmail);
        localStorage.setItem('apartment_no', apartment_no);

        // Set user state
        const userData = {
          id: user_id,
          name,
          email: residentEmail,
          apartment_no
        };

        console.log('✅ User state updated:', userData);
        setUser(userData);
        setError('');
        setLoading(false);
        return true;
      }

      setError('Invalid response from server');
      setLoading(false);
      return false;
    } catch (err) {
      console.error('❌ Login error:', err);
      const errorMsg = err.response?.data?.detail || 'Login failed';
      setError(errorMsg);
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('resident_name');
    localStorage.removeItem('resident_email');
    localStorage.removeItem('apartment_no');
    setUser(null);
    setError('');
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout
  };

  console.log('📊 AuthContext state:', { user: !!user, loading, error });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};