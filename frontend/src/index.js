import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { NotificationProvider } from './context/NotificationContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AdminProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AdminProvider>
    </AuthProvider>
  </React.StrictMode>
);