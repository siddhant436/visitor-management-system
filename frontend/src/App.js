import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { NotificationProvider } from './context/NotificationContext';

// Theme and Global Styles
import { theme } from './styles/theme';
import GlobalStyles from './styles/globalStyles';

// Pages
import Home from './pages/Home';
import Demo from './pages/Demo';
import VisitorCheckIn from './pages/VisitorCheckIn';
import VoiceCheckIn from './pages/VoiceCheckIn';
import ResidentLogin from './pages/ResidentLogin';
import ResidentRegister from './pages/ResidentRegister';
import ResidentDashboard from './pages/ResidentDashboard';
import ResidentApprovals from './pages/ResidentApprovals';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import GateEntry from './pages/GateEntry';

// ============ LOADING SCREEN ============

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.backgroundAlt} 50%, ${theme.colors.surface} 100%);
  gap: ${theme.spacing[4]};
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: ${theme.colors.gray400};
  font-size: ${theme.fontSizes.base};
  margin: 0;
`;

const LoadingScreen = () => (
  <LoadingContainer>
    <LoadingSpinner />
    <LoadingText>Loading...</LoadingText>
  </LoadingContainer>
);

// ============ PROTECTED ROUTES ============

/**
 * Protected Route for Residents
 * Checks if user is authenticated via AuthContext
 * Waits for auth check to complete before rendering
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('🔐 ProtectedRoute - Auth state:', {
    user: !!user,
    loading,
    userName: user?.name
  });

  // Show loading screen while checking authentication
  if (loading) {
    console.log('⏳ ProtectedRoute - Still loading auth...');
    return <LoadingScreen />;
  }

  // If no user after loading, redirect to login
  if (!user) {
    console.log('❌ ProtectedRoute - No user found, redirecting to login');
    return <Navigate to="/resident/login" replace />;
  }

  // User is authenticated, render protected content
  console.log('✅ ProtectedRoute - User authenticated, rendering content');
  return children;
};

/**
 * Protected Route for Admins
 * Checks if admin is authenticated via AdminContext
 * Waits for auth check to complete before rendering
 */
const AdminProtectedRoute = ({ children }) => {
  const { admin, loading } = useAdmin();

  console.log('🛡️ AdminProtectedRoute - Auth state:', {
    admin: !!admin,
    loading,
    adminName: admin?.name
  });

  // Show loading screen while checking authentication
  if (loading) {
    console.log('⏳ AdminProtectedRoute - Still loading auth...');
    return <LoadingScreen />;
  }

  // If no admin after loading, redirect to login
  if (!admin) {
    console.log('❌ AdminProtectedRoute - No admin found, redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  // Admin is authenticated, render protected content
  console.log('✅ AdminProtectedRoute - Admin authenticated, rendering content');
  return children;
};

// ============ APP ROUTES ============

/**
 * All application routes
 * Includes:
 * - Public routes (Home, Demo, Gate Entry, Visitor Check-in)
 * - Resident routes (Login, Register, Dashboard, Approvals)
 * - Admin routes (Login, Dashboard)
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/gate/entry" element={<GateEntry />} />

      {/* ===== VISITOR ROUTES ===== */}
      <Route path="/visitor/check-in" element={<VisitorCheckIn />} />
      <Route path="/visitor/voice-check-in" element={<VoiceCheckIn />} />

      {/* ===== RESIDENT ROUTES ===== */}
      <Route path="/resident/login" element={<ResidentLogin />} />
      <Route path="/resident/register" element={<ResidentRegister />} />
      
      {/* Protected Resident Routes */}
      <Route
        path="/resident/dashboard"
        element={
          <ProtectedRoute>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resident/approvals"
        element={
          <ProtectedRoute>
            <ResidentApprovals />
          </ProtectedRoute>
        }
      />

      {/* ===== ADMIN ROUTES ===== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />

      {/* ===== FALLBACK ROUTE ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ============ MAIN APP COMPONENT ============

/**
 * Main App component structure:
 * ThemeProvider (styled-components theme)
 *   ├── GlobalStyles
 *   └── Router
 *       └── AuthProvider (Resident authentication)
 *           └── AdminProvider (Admin authentication)
 *               └── NotificationProvider
 *                   └── AppRoutes (All routes)
 *
 * This ensures:
 * 1. Theme is available to all styled components
 * 2. Router wraps providers (important for navigation)
 * 3. Both auth contexts are available throughout app
 * 4. Each route can access both AuthContext and AdminContext
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router>
        <AuthProvider>
          <AdminProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </AdminProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;