import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, notification } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { KPICards } from '../components/dashboard/KPICards';
import { DroneStatusPanel } from '../components/dashboard/DroneStatusPanel';
import { EventStream } from '../components/dashboard/EventStream';
import { AMapContainer } from '../components/map/AMapContainer';
import { useEventStore } from '../stores/eventStore';
import { useDroneStore } from '../stores/droneStore';

/**
 * 大屏总览 — 首页
 * 4 区布局: KPI(左) + 地图(中) + 无人机(右) + 事件流(底)
 * 面板可折叠 · 高危事件 Toast 通知
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const loadEvents = useEventStore((s) => s.loadEvents);
  const loadDrones = useDroneStore((s) => s.loadDrones);
  const events = useEventStore((s) => s.events);

  const [kpiCollapsed, setKpiCollapsed] = useState(false);
  const [dronePanelCollapsed, setDronePanelCollapsed] = useState(false);

  // 初始化数据 (API 优先，fallback mock)
  useEffect(() => { loadEvents(); loadDrones(); }, [loadEvents, loadDrones]);

  // 高危事件 Toast 通知（监听新事件）
  const prevHighCount = useRef(events.filter((e) => e.level === 'high').length);
  useEffect(() => {
    const currentHigh = events.filter((e) => e.level === 'high');
    if (currentHigh.length > prevHighCount.current && prevHighCount.current > 0) {
      const latest = currentHigh[0];
      notification.warning({
        message: `🔴 新高危事件`,
        description: `${latest.roadName} ${latest.stakeNumber} ${latest.direction} · ${latest.sourceDetail}`,
        placement: 'topRight',
        duration: 5,
        btn: (
          <Button size="small" type="primary" onClick={() => navigate(`/event/${latest.id}`)}>
            查看详情
          </Button>
        ),
      });
    }
    prevHighCount.current = currentHigh.length;
  }, [events.length]);

  // 键盘快捷键
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // 关闭所有面板
      setKpiCollapsed(true);
      setDronePanelCollapsed(true);
    }
    if (e.key === 'f' || e.key === 'F') {
      document.getElementById('amap-container')?.requestFullscreen?.();
    }
    if (e.key === 's' || e.key === 'S') {
      navigate('/settings');
    }
    if (e.key === 'd' || e.key === 'D') {
      navigate('/drones');
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* 中间: KPI(左) + 地图(中) + 无人机(右) */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* KPI 面板（可折叠） */}
        {!kpiCollapsed && <KPICards />}

        {/* 地图区 + 左右折叠按钮 */}
        <div style={{ flex: 1, position: 'relative', background: '#0D1117' }}>
          {/* 左折叠按钮 */}
          <Button
            type="text" size="small"
            icon={kpiCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setKpiCollapsed(!kpiCollapsed)}
            style={{
              position: 'absolute', left: 4, top: 4, zIndex: 100,
              background: 'rgba(22,27,34,0.85)', borderRadius: 4,
            }}
          />
          {/* 右折叠按钮 */}
          <Button
            type="text" size="small"
            icon={dronePanelCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setDronePanelCollapsed(!dronePanelCollapsed)}
            style={{
              position: 'absolute', right: 4, top: 4, zIndex: 100,
              background: 'rgba(22,27,34,0.85)', borderRadius: 4,
            }}
          />
          <AMapContainer />
        </div>

        {/* 无人机面板（可折叠） */}
        {!dronePanelCollapsed && <DroneStatusPanel />}
      </div>

      {/* 底部: 实时事件流 */}
      <div style={{ height: 168, borderTop: '1px solid #30363D', flexShrink: 0 }}>
        <EventStream />
      </div>
    </>
  );
}
