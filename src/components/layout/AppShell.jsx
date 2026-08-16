import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'sonner';
import { AudioNotifier } from '../AudioNotifier';
import { TimerEngine } from '../TimerEngine';

export function AppShell() {
  const { isAuthenticated, currentUser } = useSelector(state => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Basic check to ensure the user doesn't access other roles' paths
  // SUPER_ADMIN can access anything.
  const path = location.pathname;
  if (currentUser.role !== 'SUPER_ADMIN') {
    const rolePrefix = currentUser.role === 'DELIVERY_BOY' ? '/delivery' : `/${currentUser.role.toLowerCase()}`;
    if (!path.startsWith(rolePrefix) && path !== '/') {
      return <Navigate to={`${rolePrefix}/dashboard`} replace />;
    }
  }

  return (
    <div className="flex h-screen bg-peach-soft overflow-hidden">
      <Toaster position="top-right" richColors />
      <AudioNotifier />
      <TimerEngine />
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
