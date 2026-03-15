import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { NotificationProvider } from './context/NotificationContext';
import Home from './pages/Home';
import Demo from './pages/Demo';
import VisitorCheckIn from './pages/VisitorCheckIn';
import VoiceCheckIn from './pages/VoiceCheckIn';
import ResidentLogin from './pages/ResidentLogin';
import ResidentRegister from './pages/ResidentRegister';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import GateEntry from './pages/GateEntry';

// Protected Route for Residents
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/resident/login" />;
};

// Protected Route for Admins
const AdminProtectedRoute = ({ children }) => {
  const { admin, loading } = useAdmin();
  
  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>;
  }
  
  return admin ? children : <Navigate to="/admin/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/gate/entry" element={<GateEntry />} />
      <Route path="/visitor/check-in" element={<VisitorCheckIn />} />
      <Route path="/visitor/voice-check-in" element={<VoiceCheckIn />} />
      <Route path="/resident/login" element={<ResidentLogin />} />
      <Route path="/resident/register" element={<ResidentRegister />} />
      <Route
        path="/resident/dashboard"
        element={
          <ProtectedRoute>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;