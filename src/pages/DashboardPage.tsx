import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, App } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { KPICards } from '../components/dashboard/KPICards';
import { DroneStatusPanel } from '../components/dashboard/DroneStatusPanel';
import { EventStream } from '../components/dashboard/EventStream';
import { AMapContainer } from '../components/map/AMapContainer';
import { DashboardSkeleton } from '../components/shared/LoadingSkeleton';
import { useEventStore } from '../stores/eventStore';
import { useDroneStore } from '../stores/droneStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useResponsive } from '../hooks/useResponsive';
import { useThemeColors } from '../theme';

/**
 * 大屏总览 — 首页
 * 4 区布局: KPI(左) + 地图(中) + 无人机(右) + 事件流(底)
 * 面板可折叠 · 高危事件 Toast 通知 · 响应式适配
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const loadEvents = useEventStore((s) => s.loadEvents);
  const loadDrones = useDroneStore((s) => s.loadDrones);
  const events = useEventStore((s) => s.events);
  const eventLoading = useEventStore((s) => s.loading);
  const drones = useDroneStore((s) => s.drones);
  const droneLoading = useDroneStore((s) => s.loading);
  const bp = useResponsive();

  // 响应式：小屏默认折叠侧面板
  const [kpiCollapsed, setKpiCollapsed] = useState(bp === 'sm');
  const [dronePanelCollapsed, setDronePanelCollapsed] = useState(bp === 'sm' || bp === 'md');

  // 初始化数据 (API 优先，fallback mock)
  useEffect(() => { loadEvents(); loadDrones(); }, [loadEvents, loadDrones]);

  // WebSocket 实时推送
  useWebSocket();

  // 高危事件 Toast（监听新事件）— 必须在条件返回之前调用
  const prevHighCount = useRef(events.filter((e) => e.level === 'high').length);
  useEffect(() => {
    const currentHigh = events.filter((e) => e.level === 'high');
    if (currentHigh.length > prevHighCount.current && prevHighCount.current > 0) {
      const latest = currentHigh[0];
      notification.warning({
        title: `🔴 新高危事件`,
        description: `${latest.roadName} ${latest.stakeNumber} ${latest.direction} · ${latest.sourceDetail}`,
        placement: 'topRight',
        duration: 5,
        actions: (
          <Button size="small" type="primary" onClick={() => navigate(`/event/${latest.id}`)}>
            查看详情
          </Button>
        ),
      });
    }
    prevHighCount.current = currentHigh.length;
  }, [events.length]);

  // 事件筛选状态
  const setFilterLevel = useEventStore((s) => s.setFilterLevel);

  // 键盘快捷键 — 必须在条件返回之前调用
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 不拦截输入框内的按键
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.key) {
      case 'Escape':
        setKpiCollapsed(true);
        setDronePanelCollapsed(true);
        break;
      case 'f': case 'F':
        document.getElementById('amap-container')?.requestFullscreen?.();
        break;
      case 's': case 'S':
        navigate('/settings');
        break;
      case 'd': case 'D':
        navigate('/drones');
        break;
      case '1':
        setFilterLevel('all');
        break;
      case '2':
        setFilterLevel('high');
        break;
      case '3':
        setFilterLevel('medium');
        break;
      case '4':
        setFilterLevel('low');
        break;
    }
  }, [navigate, setFilterLevel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const t = useThemeColors();

  // 加载中 — 必须在所有 hooks 之后才能条件返回
  if (eventLoading || droneLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {/* 中间: KPI(左) + 地图(中) + 无人机(右) */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* KPI 面板（可折叠 + 过渡动画 + 响应式宽度） */}
        <div style={{
          width: kpiCollapsed ? 0 : bp === 'md' ? 148 : 170,
          overflow: 'hidden',
          transition: 'width 0.25s ease',
          flexShrink: 0,
        }}>
          <KPICards />
        </div>

        {/* 地图区 + 折叠按钮（移动端隐藏） */}
        <div style={{ flex: 1, position: 'relative', background: t.bg, transition: 'all 0.25s ease' }}>
          {/* 折叠按钮 — 仅非移动端显示 */}
          {bp !== 'sm' && (
            <>
              <Button
                type="text" size="small"
                icon={kpiCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setKpiCollapsed(!kpiCollapsed)}
                style={{
                  position: 'absolute', left: 4, top: 4, zIndex: 100,
                  background: t.cardBg, borderRadius: 4,
                }}
              />
              <Button
                type="text" size="small"
                icon={dronePanelCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setDronePanelCollapsed(!dronePanelCollapsed)}
                style={{
                  position: 'absolute', right: 4, top: 4, zIndex: 100,
                  background: t.cardBg, borderRadius: 4,
                }}
              />
            </>
          )}
          {/* 半透明浮动事件摘要（所有屏幕） */}
          <div style={{
            position: 'absolute', top: 4, left: bp === 'sm' ? 4 : 36, zIndex: 100,
            background: t.cardBg, borderRadius: 6, padding: '4px 10px',
            fontSize: 12, color: t.muted, opacity: 0.9,
            display: 'flex', gap: 12,
          }}>
            <span>📡 事件 <b style={{ color: t.text }}>{events.length}</b></span>
            <span style={{ color: '#F85149' }}>待处理 <b>{events.filter(e => e.status === 'pending').length}</b></span>
            <span style={{ color: '#3FB950' }}>🚁 <b>{drones.filter(d => d.status === 'flying').length}/{drones.length}</b></span>
          </div>

          <AMapContainer />
        </div>

        {/* 无人机面板（可折叠 + 过渡动画 + 响应式宽度） */}
        <div style={{
          width: dronePanelCollapsed ? 0 : bp === 'md' ? 188 : 220,
          overflow: 'hidden',
          transition: 'width 0.25s ease',
          flexShrink: 0,
        }}>
          <DroneStatusPanel />
        </div>
      </div>

      {/* 底部: 实时事件流（高度随屏幕自适应） */}
      <div style={{
        height: bp === 'sm' ? 120 : bp === 'md' ? 148 : 168,
        borderTop: `1px solid ${t.border}`,
        flexShrink: 0, transition: 'height 0.25s ease',
      }}>
        <EventStream />
      </div>
    </>
  );
}
