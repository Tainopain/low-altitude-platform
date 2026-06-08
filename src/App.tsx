import { useEffect } from 'react';
import { ConfigProvider, App as AntApp, Layout, theme as antTheme } from 'antd';
import { useUIStore } from './stores/uiStore';
import { useEventStore } from './stores/eventStore';
import { useDroneStore } from './stores/droneStore';
import { darkTheme, lightTheme } from './theme';
import { AppHeader } from './components/layout/AppHeader';
import { KPICards } from './components/dashboard/KPICards';
import { DroneStatusPanel } from './components/dashboard/DroneStatusPanel';
import { EventStream } from './components/dashboard/EventStream';
import { AMapContainer } from './components/map/AMapContainer';
import { AIDrawer } from './components/ai/AIDrawer';
import { HistoryDrawer } from './components/history/HistoryDrawer';

function App() {
  const themeMode = useUIStore((s) => s.theme);
  const isDark = themeMode === 'dark';
  const loadMockEvents = useEventStore((s) => s.loadMockEvents);
  const loadMockDrones = useDroneStore((s) => s.loadMockDrones);

  useEffect(() => { loadMockEvents(); loadMockDrones(); }, [loadMockEvents, loadMockDrones]);

  return (
    <ConfigProvider
      theme={{
        ...(isDark ? darkTheme : lightTheme),
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
    >
      <AntApp>
        <Layout style={{ height: '100vh' }}>
          {/* 顶栏: AI 守护 X 天 | 今日事件 N | 待处理 M | 无人机 | 摄像头 | 路段 | 时间 */}
          <AppHeader />

          {/* 中间: KPI(左) + 地图(中) + 无人机状态(右) */}
          <Layout.Content style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <KPICards />
            <div style={{ flex: 1, position: 'relative', background: '#0D1117' }}>
              <AMapContainer />
            </div>
            <DroneStatusPanel />
          </Layout.Content>

          {/* 底部: 实时事件流（横向滚动） */}
          <div style={{ height: 168, borderTop: '1px solid #30363D', flexShrink: 0 }}>
            <EventStream />
          </div>
        </Layout>

        <AIDrawer />
        <HistoryDrawer />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
