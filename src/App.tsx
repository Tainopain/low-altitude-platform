import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import { useUIStore } from './stores/uiStore';
import { darkTheme, lightTheme } from './theme';
import { router } from './router';

function App() {
  const themeMode = useUIStore((s) => s.theme);
  const isDark = themeMode === 'dark';

  return (
    <ConfigProvider
      theme={{
        ...(isDark ? darkTheme : lightTheme),
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
