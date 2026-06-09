import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { AppHeader } from './AppHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { AIDrawer } from '../ai/AIDrawer';
import { HistoryDrawer } from '../history/HistoryDrawer';
import { ErrorBoundary } from '../shared/ErrorBoundary';

export function AppLayout() {
  return (
    <Layout style={{ height: '100vh' }}>
      <AppHeader />
      <Layout.Content style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Layout.Content>
      <MobileBottomNav />
      <AIDrawer />
      <HistoryDrawer />
    </Layout>
  );
}
