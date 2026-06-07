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
import useAuthStore from './store/useAuthStore';

function App() {
  const { initAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      
      <Route path="/" element={
        isAuthenticated ? <MainLayout><Feed /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/profile/:username" element={
        isAuthenticated ? <MainLayout><Profile /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/messages" element={
        isAuthenticated ? <MainLayout><Messages /></MainLayout> : <Navigate to="/login" />
      } />
      
      <Route path="/network" element={
        isAuthenticated ? <MainLayout><Network /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/circles" element={
        isAuthenticated ? <MainLayout><Circles /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/circles/:id" element={
        isAuthenticated ? <MainLayout><CircleWorkspace /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/collabs" element={
        isAuthenticated ? <MainLayout><Collabs /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/collabs/new" element={
        isAuthenticated ? <MainLayout><NewCollab /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/collabs/:id" element={
        isAuthenticated ? <MainLayout><CollabDetail /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/collabs/manage/:id" element={
        isAuthenticated ? <MainLayout><CollabManage /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/wallet" element={
        isAuthenticated ? <MainLayout><Wallet /></MainLayout> : <Navigate to="/login" />
      } />
      <Route path="/notifications" element={
        isAuthenticated ? <MainLayout><Notifications /></MainLayout> : <Navigate to="/login" />
      } />
      
      <Route path="/files" element={
        isAuthenticated ? <MainLayout><FilesHub /></MainLayout> : <Navigate to="/login" />
      } />

      <Route path="/share/:linkId" element={<PublicSharePage />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
}

export default App;
