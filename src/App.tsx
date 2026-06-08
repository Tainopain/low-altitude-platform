import { useEffect } from 'react';
import { ConfigProvider, App as AntApp, Layout, theme as antTheme } from 'antd';
import { useUIStore } from './stores/uiStore';
import { useEventStore } from './stores/eventStore';
import { useDroneStore } from './stores/droneStore';
import { darkTheme, lightTheme } from './theme';
import { AppHeader } from './components/layout/AppHeader';
import { AppFooter } from './components/layout/AppFooter';
import { EventSider } from './components/layout/EventSider';
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
          <AppHeader />
          <Layout style={{ flex: 1 }}>
            <Layout.Content style={{ position: 'relative', background: '#0D1117' }}>
              <AMapContainer />
            </Layout.Content>
            <EventSider />
          </Layout>
          <AppFooter />
        </Layout>
        <AIDrawer />
        <HistoryDrawer />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
