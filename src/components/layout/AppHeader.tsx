import { Layout, Space, Tag, Button } from 'antd';
import { SunOutlined, MoonOutlined, SettingOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { useEffect, useState } from 'react';

export function AppHeader() {
  const { theme, toggleTheme } = useUIStore();
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const flyingCount = drones.filter((d) => d.status === 'flying').length;
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const [time, setTime] = useState(new Date());

  // AI 守护天数（从系统首次运行计算）
  const aiDays = Math.ceil((Date.now() - new Date('2026-05-01').getTime()) / 86400000);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout.Header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: 48, lineHeight: '48px',
    }}>
      <Space size={12}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🛩️ 低空平台</span>
        <Tag color="blue">AI 守护 {aiDays} 天</Tag>
        <Tag>今日事件 {events.length} 条</Tag>
        <Tag color={pendingCount > 0 ? 'orange' : 'default'}>待处理 {pendingCount} 条</Tag>
        <Tag color={flyingCount > 0 ? 'green' : 'red'}>无人机 {flyingCount}/{drones.length}</Tag>
        <Tag color="green">摄像头 4/4</Tag>
        <Tag>试点路段 G50 K0~K60</Tag>
      </Space>
      <Space size={4}>
        <span style={{ color: '#8B949E', fontSize: 13 }}>
          {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <Button type="text" icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />} onClick={toggleTheme} />
        <Button type="text" icon={<SettingOutlined />} />
      </Space>
    </Layout.Header>
  );
}
