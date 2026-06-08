import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { AppHeader } from './AppHeader';
import { AIDrawer } from '../ai/AIDrawer';
import { HistoryDrawer } from '../history/HistoryDrawer';

/**
 * 应用 Layout 壳
 * - 顶栏常驻
 * - 内容区由 <Outlet> 渲染（Router 控制的页面）
 * - AI 助手 / 历史查询 Drawer 全局可用
 */
export function AppLayout() {
  return (
    <Layout style={{ height: '100vh' }}>
      <AppHeader />
      <Layout.Content style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Outlet />
      </Layout.Content>
      <AIDrawer />
      <HistoryDrawer />
    </Layout>
  );
}
