import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Wallet from './pages/Wallet';
import Collabs from './pages/Collabs';
import CollabDetail from './pages/CollabDetail';
import NewCollab from './pages/NewCollab';
import CollabManage from './pages/CollabManage';
import Login from './pages/Login';
import Register from './pages/Register';
import Network from './pages/Network';
import Circles from './pages/Circles';
import CircleWorkspace from './pages/CircleWorkspace';
import Notifications from './pages/Notifications';
import FilesHub from './pages/FilesHub';
import PublicSharePage from './pages/PublicSharePage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import SearchResults from './pages/SearchResults';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminDashboard from './pages/AdminDashboard'; // We'll build this soon
import AdminRoute from './components/AdminRoute';
import useAuthStore from './store/useAuthStore';

function App() {
  const { initAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // A user is considered fully onboarded if their skills property is present (even if empty string)
  const isOnboarded = isAuthenticated && user?.skills !== null && user?.skills !== undefined;

  // Helper to protect routes that require full authentication and onboarding
  const requireAuth = (element) => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (!isOnboarded) return <Navigate to="/register" state={{ resumeOnboarding: true, username: user?.username }} />;
    return element;
  };

  const requireAdmin = (element) => {
    return <AdminRoute>{element}</AdminRoute>;
  };

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated || !isOnboarded ? <Register /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/" />} />
      <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" />} />
      
      <Route path="/" element={requireAuth(<MainLayout><Feed /></MainLayout>)} />
      <Route path="/profile/:username" element={requireAuth(<MainLayout><Profile /></MainLayout>)} />
      <Route path="/messages" element={requireAuth(<MainLayout><Messages /></MainLayout>)} />
      <Route path="/network" element={requireAuth(<MainLayout><Network /></MainLayout>)} />
      <Route path="/circles" element={requireAuth(<MainLayout><Circles /></MainLayout>)} />
      <Route path="/circles/:id" element={requireAuth(<MainLayout><CircleWorkspace /></MainLayout>)} />
      <Route path="/collabs" element={requireAuth(<MainLayout><Collabs /></MainLayout>)} />
      <Route path="/collabs/new" element={requireAuth(<MainLayout><NewCollab /></MainLayout>)} />
      <Route path="/collabs/:id" element={requireAuth(<MainLayout><CollabDetail /></MainLayout>)} />
      <Route path="/collabs/manage/:id" element={requireAuth(<MainLayout><CollabManage /></MainLayout>)} />
      <Route path="/wallet" element={requireAuth(<MainLayout><Wallet /></MainLayout>)} />
      <Route path="/admin/dashboard" element={requireAuth(requireAdmin(<MainLayout><AdminDashboard /></MainLayout>))} />
      <Route path="/notifications" element={requireAuth(<MainLayout><Notifications /></MainLayout>)} />
      <Route path="/files" element={requireAuth(<MainLayout><FilesHub /></MainLayout>)} />
      <Route path="/settings" element={requireAuth(<MainLayout><Settings /></MainLayout>)} />
      <Route path="/search" element={requireAuth(<MainLayout><SearchResults /></MainLayout>)} />

      <Route path="/share/:linkId" element={<PublicSharePage />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={isAuthenticated && isOnboarded ? "/" : "/login"} />} />
    </Routes>
  );
}

export default App;
