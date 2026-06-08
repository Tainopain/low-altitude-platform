import { Layout, Space, Tag, Button } from 'antd';
import { SunOutlined, MoonOutlined, SettingOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useDroneStore } from '../../stores/droneStore';

export function AppHeader() {
  const { theme, toggleTheme } = useUIStore();
  const drones = useDroneStore((s) => s.drones);
  const flyingCount = drones.filter((d) => d.status === 'flying').length;

  return (
    <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
      <Space>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🛩️ 低空平台</span>
        <Tag>试点路段 G50 K0~K60</Tag>
        <Tag color={flyingCount > 0 ? 'green' : 'red'}>
          无人机 {flyingCount}/{drones.length}
        </Tag>
        <Tag color="green">摄像头 4/4</Tag>
      </Space>
      <Space>
        <Button
          type="text"
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
        />
        <Button type="text" icon={<SettingOutlined />} />
      </Space>
    </Layout.Header>
  );
}
