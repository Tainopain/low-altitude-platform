import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Space, Tag, Button } from 'antd';
import {
  SunOutlined, MoonOutlined, SettingOutlined,
  SendOutlined, BarChartOutlined, HomeOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { useResponsive } from '../../hooks/useResponsive';
import { useEffect, useState } from 'react';
import { useThemeColors } from '../../theme';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const bp = useResponsive();
  const { theme, toggleTheme, wsConnected } = useUIStore();
  const t = useThemeColors();
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const flyingCount = drones.filter((d) => d.status === 'flying').length;
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const [time, setTime] = useState(new Date());
  const isMobile = bp === 'sm';

  const aiDays = Math.ceil((Date.now() - new Date('2026-05-01').getTime()) / 86400000);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <Layout.Header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 8px' : '0 12px', height: isMobile ? 40 : 48, lineHeight: isMobile ? '40px' : '48px',
    }}>
      <Space size={isMobile ? 4 : 8}>
        <Button
          type="text" size="small" icon={<HomeOutlined />}
          onClick={() => navigate('/')}
          style={{ color: isActive('/') ? '#58A6FF' : undefined }}
        />
        <span style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>🛩️ 低空平台</span>
        {/* 移动端精简统计 */}
        {!isMobile && (
          <>
            <Tag color="blue">AI 守护 {aiDays} 天</Tag>
            <Tag>事件 {events.length}</Tag>
            <Tag color={pendingCount > 0 ? 'orange' : 'default'}>待处理 {pendingCount}</Tag>
            <Tag color={flyingCount > 0 ? 'green' : 'red'}>无人机 {flyingCount}/{drones.length}</Tag>
            <Tag color="green">摄像头 9/9</Tag>
          </>
        )}
        {isMobile && (
          <>
            <Tag style={{ fontSize: 10, padding: '0 4px' }}>事件 {events.length}</Tag>
            <Tag color={pendingCount > 0 ? 'orange' : 'default'} style={{ fontSize: 10, padding: '0 4px' }}>待 {pendingCount}</Tag>
            <Tag color={flyingCount > 0 ? 'green' : 'red'} style={{ fontSize: 10, padding: '0 4px' }}>🚁 {flyingCount}/{drones.length}</Tag>
          </>
        )}
      </Space>

      <Space size={0}>
        {/* Desktop nav */}
        {!isMobile && (
          <>
            <Button type="text" size="small" icon={<SendOutlined />} onClick={() => navigate('/drones')}
              style={{ color: isActive('/drones') ? '#58A6FF' : undefined }}>无人机</Button>
            <Button type="text" size="small" icon={<BarChartOutlined />} onClick={() => navigate('/analytics')}
              style={{ color: isActive('/analytics') ? '#58A6FF' : undefined }}>数据</Button>
            <Button type="text" size="small" icon={<SettingOutlined />} onClick={() => navigate('/settings')}
              style={{ color: isActive('/settings') ? '#58A6FF' : undefined }} />
          </>
        )}

        <span
          title={wsConnected ? 'WebSocket 已连接' : 'WebSocket 断开'}
          style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: wsConnected ? '#3FB950' : '#F85149',
            boxShadow: `0 0 4px ${wsConnected ? '#3FB950' : '#F85149'}`,
            margin: '0 4px', transition: 'background 0.3s',
          }}
        />
        <span style={{ color: t.muted, fontSize: isMobile ? 10 : 12, marginRight: 4 }}>
          {isMobile ? time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <Button type="text" size="small" icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />} onClick={toggleTheme} />
        {!isMobile && (
          <Button type="text" size="small" icon={<LogoutOutlined />} onClick={() => { localStorage.clear(); navigate('/login'); }} />
        )}
      </Space>
    </Layout.Header>
  );
}
