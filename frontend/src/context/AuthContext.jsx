import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');
    const userEmail = localStorage.getItem('user_email');
    const apartmentNo = localStorage.getItem('apartment_no');
    const token = localStorage.getItem('access_token');

    if (userId && userName && userEmail && token) {
      setUser({
        id: parseInt(userId),
        name: userName,
        email: userEmail,
        apartment_no: apartmentNo,
      });
    }

    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user_id', userData.id);
    localStorage.setItem('user_name', userData.name);
    localStorage.setItem('user_email', userData.email);
    localStorage.setItem('apartment_no', userData.apartment_no);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('apartment_no');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}