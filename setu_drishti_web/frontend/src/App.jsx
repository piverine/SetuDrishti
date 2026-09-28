import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Layout from './components/Layout';

export default function App({ mockupAuth }) {
  // Force demo mode for development when Clerk token doesn't work
  const isDev = false; // Always allow dev mode
  
  if (mockupAuth || isDev) {
    return (
      <Routes>
        <Route path="/" element={<Landing mockupAuth={true} />} />
        <Route element={<Layout mockupAuth={true} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <>
          <SignedIn><Navigate to="/dashboard" replace /></SignedIn>
          <SignedOut><Landing /></SignedOut>
        </>
      } />
      
      <Route element={
        <>
          <SignedIn><Layout mockupAuth={false} /></SignedIn>
          <SignedOut><RedirectToSignIn /></SignedOut>
        </>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}