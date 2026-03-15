import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in
    const adminId = localStorage.getItem('admin_id');
    const adminName = localStorage.getItem('admin_name');
    const adminEmail = localStorage.getItem('admin_email');
    const token = localStorage.getItem('admin_token');

    if (adminId && adminName && adminEmail && token) {
      setAdmin({
        id: parseInt(adminId),
        name: adminName,
        email: adminEmail,
      });
    }

    setLoading(false);
  }, []);

  const login = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem('admin_id', adminData.id);
    localStorage.setItem('admin_name', adminData.name);
    localStorage.setItem('admin_email', adminData.email);
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_id');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_email');
  };

  return (
    <AdminContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}