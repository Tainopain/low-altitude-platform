import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Space, Tag, Button } from 'antd';
import {
  SunOutlined, MoonOutlined, SettingOutlined,
  SendOutlined, BarChartOutlined, HomeOutlined,
} from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { useEffect, useState } from 'react';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useUIStore();
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const flyingCount = drones.filter((d) => d.status === 'flying').length;
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const [time, setTime] = useState(new Date());

  const aiDays = Math.ceil((Date.now() - new Date('2026-05-01').getTime()) / 86400000);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <Layout.Header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', height: 48, lineHeight: '48px',
    }}>
      <Space size={8}>
        <Button
          type="text" size="small" icon={<HomeOutlined />}
          onClick={() => navigate('/')}
          style={{ color: isActive('/') ? '#58A6FF' : undefined }}
        />
        <span style={{ fontWeight: 700, fontSize: 15 }}>🛩️ 低空平台</span>
        <Tag color="blue">AI 守护 {aiDays} 天</Tag>
        <Tag>事件 {events.length}</Tag>
        <Tag color={pendingCount > 0 ? 'orange' : 'default'}>待处理 {pendingCount}</Tag>
        <Tag color={flyingCount > 0 ? 'green' : 'red'}>无人机 {flyingCount}/{drones.length}</Tag>
        <Tag color="green">摄像头 4/4</Tag>
      </Space>

      <Space size={0}>
        {/* Page nav */}
        <Button
          type="text" size="small" icon={<SendOutlined />}
          onClick={() => navigate('/drones')}
          style={{ color: isActive('/drones') ? '#58A6FF' : undefined }}
        >无人机</Button>
        <Button
          type="text" size="small" icon={<BarChartOutlined />}
          onClick={() => navigate('/analytics')}
          style={{ color: isActive('/analytics') ? '#58A6FF' : undefined }}
        >数据</Button>
        <Button
          type="text" size="small" icon={<SettingOutlined />}
          onClick={() => navigate('/settings')}
          style={{ color: isActive('/settings') ? '#58A6FF' : undefined }}
        />

        <span style={{ color: '#8B949E', fontSize: 12, margin: '0 8px' }}>
          {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <Button type="text" size="small" icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />} onClick={toggleTheme} />
      </Space>
    </Layout.Header>
  );
}
