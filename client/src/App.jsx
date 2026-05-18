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
        <MainLayout>
          <Feed />
        </MainLayout>
      } />

      <Route path="/profile/:username" element={
        <MainLayout>
          <Profile />
        </MainLayout>
      } />

      <Route path="/messages" element={
        <MainLayout>
          <Messages />
        </MainLayout>
      } />
      
      <Route path="/network" element={
        <MainLayout>
          <Network />
        </MainLayout>
      } />

      <Route path="/circles" element={
        <MainLayout>
          <Circles />
        </MainLayout>
      } />

      <Route path="/circles/:id" element={
        <MainLayout>
          <CircleWorkspace />
        </MainLayout>
      } />

      <Route path="/collabs" element={
        <MainLayout>
          <Collabs />
        </MainLayout>
      } />

      <Route path="/collabs/new" element={
        <MainLayout>
          <NewCollab />
        </MainLayout>
      } />

      <Route path="/collabs/:id" element={
        <MainLayout>
          <CollabDetail />
        </MainLayout>
      } />

      <Route path="/collabs/manage/:id" element={
        <MainLayout>
          <CollabManage />
        </MainLayout>
      } />

      <Route path="/wallet" element={
        <MainLayout>
          <Wallet />
        </MainLayout>
      } />
      <Route path="/notifications" element={
        <MainLayout>
          <Notifications />
        </MainLayout>
      } />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
