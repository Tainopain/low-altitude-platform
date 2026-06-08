import { useEffect, useRef, useState } from 'react';
import { Spin, Alert } from 'antd';
import { useAMap } from '../../hooks/useAMap';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { MapLegend } from './MapLegend';
import { DroneVideoWindow } from './DroneVideoWindow';

// 试点路段 G50 中点坐标（重庆附近，Demo 用）
const CENTER: [number, number] = [106.551, 29.562];
const HANGAR_COORDS: [number, number] = [106.545, 29.550]; // 机舱位置

export function AMapContainer() {
  const { amap, loaded, error } = useAMap({ containerId: 'amap-container', center: CENTER, zoom: 12 });
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const markersRef = useRef<Map<string, any>>(new Map());
  const prevDispatchingRef = useRef<Set<string>>(new Set());
  const [keyWarningDismissed, setKeyWarningDismissed] = useState(false);

  // 初始化固定 Marker（机舱）
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    // 机舱 Marker
    const hangarMarker = new AMap.Marker({
      position: HANGAR_COORDS,
      content: '<div style="font-size:20px;text-align:center;">🏠</div>',
      offset: new AMap.Pixel(-12, -12),
    });
    hangarMarker.setMap(amap);
    markersRef.current.set('hangar', hangarMarker);
  }, [amap]);

  // 同步事件 Markers
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    // 清理旧的事件 markers
    markersRef.current.forEach((m, key) => { if (key.startsWith('evt_')) m.setMap(null); });

    events.forEach((evt) => {
      const color = evt.level === 'high' ? '#F85149' : evt.level === 'medium' ? '#D29922' : '#79C0FF';
      const pulseClass = evt.level === 'high' ? 'marker-pulse' : '';
      const marker = new AMap.Marker({
        position: evt.coordinates,
        content: `<div class="${pulseClass}" style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid ${color}44;"></div>`,
        offset: new AMap.Pixel(-7, -7),
      });
      marker.on('click', () => {
        console.log('Event clicked:', evt.id);
      });
      marker.setMap(amap);
      markersRef.current.set(`evt_${evt.id}`, marker);
    });
  }, [amap, events]);

  // 判断坐标是否与机舱相同
  const isSameCoords = (a: [number, number], b: [number, number]) =>
    a[0] === b[0] && a[1] === b[1];

  // 同步无人机 Markers（与机舱重叠时只显示机舱）
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    markersRef.current.forEach((m, key) => { if (key.startsWith('drone_')) m.setMap(null); });

    drones.forEach((drone) => {
      if (drone.status === 'offline') return;
      // 无人机与机舱在同一位置时，隐藏无人机，只显示机舱
      if (isSameCoords(drone.coordinates, HANGAR_COORDS)) return;
      const color = drone.status === 'flying' ? '#3FB950' : '#D29922';
      const marker = new AMap.Marker({
        position: drone.coordinates,
        content: `<div style="font-size:18px;transform:rotate(${drone.heading}deg);text-align:center;color:${color};">✈️</div>`,
        offset: new AMap.Pixel(-10, -10),
      });
      marker.on('click', () => {
        console.log('Drone clicked:', drone.id);
      });
      marker.setMap(amap);
      markersRef.current.set(`drone_${drone.id}`, marker);
    });
  }, [amap, drones]);

  // 调度动画：监听 events 中 status='dispatching' 的事件
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    const dispatchingEvents = events.filter((e) => e.status === 'dispatching' && e.droneId);
    const currentIds = new Set(dispatchingEvents.map((e) => e.id));

    dispatchingEvents.forEach((evt) => {
      if (prevDispatchingRef.current.has(evt.id)) return; // 已启动动画

      const drone = drones.find((d) => d.id === evt.droneId);
      if (!drone) return;

      // 创建轨迹线
      const polyline = new AMap.Polyline({
        path: [drone.coordinates, evt.coordinates],
        strokeColor: '#58A6FF',
        strokeWeight: 2,
        strokeStyle: 'dashed',
        strokeDasharray: [10, 10],
      });
      polyline.setMap(amap);

      // 创建临时 Marker 做动画
      const droneMarker = markersRef.current.get(`drone_${drone.id}`);
      if (droneMarker) {
        droneMarker.moveTo(evt.coordinates, { duration: 4000, autoRotation: true });
      }

      // 动画结束后清理轨迹线
      setTimeout(() => {
        polyline.setMap(null);
      }, 5000);
    });

    prevDispatchingRef.current = currentIds;
  }, [events, drones, amap]);

  if (error) return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0D1117', color: '#F85149', padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>地图加载失败</div>
        <div style={{ color: '#8B949E', fontSize: 13, lineHeight: 1.8 }}>{error}</div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div id="amap-container" style={{ height: '100%', width: '100%' }} />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin description="地图加载中..." />
        </div>
      )}
      {loaded && <MapLegend />}
      {loaded && !keyWarningDismissed && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 100, maxWidth: 340,
        }}>
          <Alert
            type="warning"
            title="地图Key未配置"
            description="如地图未显示，请到 AMap 控制台获取 Key 并将 localhost 加入白名单，填入 .env 文件"
            closable
            onClose={() => setKeyWarningDismissed(true)}
            style={{ fontSize: 12 }}
          />
        </div>
      )}
      <DroneVideoWindow />
    </div>
  );
}
