import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import Agents from '@/pages/Agents';
import Workflows from '@/pages/Workflows';
import Coding from '@/pages/Coding';
import Settings from '@/pages/Settings';
import ArcaneStudio from '@/pages/ArcaneStudio';
import ScheduledWorkflows from '@/pages/ScheduledWorkflows';
import SplashScreen from '@/components/SplashScreen';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
}

function App() {
  const [loading, setLoading] = useState(true);
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setLoading(false);
    };
    init();
  }, [checkAuth]);

  // Handle theme application
  useEffect(() => {
    if (user?.theme_preference) {
      const theme = user.theme_preference;
      document.body.setAttribute('data-theme', theme);
    } else {
      document.body.setAttribute('data-theme', 'dark');
    }
  }, [user?.theme_preference]);

  if (loading) {
    return <SplashScreen onComplete={() => {}} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Private Routes */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/studio" element={<ArcaneStudio />} />
          <Route path="/coding" element={<Coding />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/scheduled" element={<ScheduledWorkflows />} />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
