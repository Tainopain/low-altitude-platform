import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppLayout } from './components/layout/AppLayout';
// Dashboard is the home page, eager-load for instant render
import { DashboardPage } from './pages/DashboardPage';

// Code-split all other pages for smaller initial bundle
const LoginPage = lazy(() => import('./pages/LoginPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const DronePage = lazy(() => import('./pages/DronePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin description="加载中..." />
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Simple auth check
function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LazyPage><LoginPage /></LazyPage>,
  },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'event/:id', element: <LazyPage><EventDetailPage /></LazyPage> },
      { path: 'drones', element: <LazyPage><DronePage /></LazyPage> },
      { path: 'analytics', element: <LazyPage><AnalyticsPage /></LazyPage> },
      { path: 'settings', element: <LazyPage><SettingsPage /></LazyPage> },
    ],
  },
]);
