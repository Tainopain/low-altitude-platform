import { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { useAMap } from '../../hooks/useAMap';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { MapLegend } from './MapLegend';
import { DroneVideoWindow } from './DroneVideoWindow';

// 试点路段 G50 中点坐标（重庆附近，Demo 用）
const CENTER: [number, number] = [106.551, 29.562];
const NEST_COORDS: [number, number] = [106.545, 29.550]; // 机巢位置

export function AMapContainer() {
  const { amap, loaded, error } = useAMap({ containerId: 'amap-container', center: CENTER, zoom: 12 });
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const markersRef = useRef<Map<string, any>>(new Map());
  const prevDispatchingRef = useRef<Set<string>>(new Set());

  // 初始化固定 Marker（机巢）
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    // 机巢 Marker
    const nestMarker = new AMap.Marker({
      position: NEST_COORDS,
      content: '<div style="font-size:20px;text-align:center;">🏠</div>',
      offset: new AMap.Pixel(-12, -12),
    });
    nestMarker.setMap(amap);
    markersRef.current.set('nest', nestMarker);
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

  // 同步无人机 Markers
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    markersRef.current.forEach((m, key) => { if (key.startsWith('drone_')) m.setMap(null); });

    drones.forEach((drone) => {
      if (drone.status === 'offline') return;
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

  if (error) return <div style={{ color: '#F85149', padding: 24 }}>地图加载失败: {error}</div>;

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div id="amap-container" style={{ height: '100%', width: '100%' }} />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin tip="地图加载中..." />
        </div>
      )}
      {loaded && <MapLegend />}
      <DroneVideoWindow />
    </div>
  );
}
