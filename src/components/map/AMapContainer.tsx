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

  // 同步无人机 Markers（与机舱重叠且未被调度时只显示机舱）
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    // 清理旧的无人机 markers
    const oldKeys: string[] = [];
    markersRef.current.forEach((m, key) => { if (key.startsWith('drone_')) { m.setMap(null); oldKeys.push(key); } });
    oldKeys.forEach((k) => markersRef.current.delete(k));

    // 正在被调度的无人机 ID 集合
    const dispatchingDroneIds = new Set(
      events.filter((e) => e.status === 'dispatching' && e.droneId).map((e) => e.droneId!)
    );

    drones.forEach((drone) => {
      if (drone.status === 'offline') return;
      // 无人机与机舱在同一位置时隐藏，但正在被调度的除外（需要有 Marker 才能看到飞行动画）
      if (isSameCoords(drone.coordinates, HANGAR_COORDS) && !dispatchingDroneIds.has(drone.id)) return;
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
  }, [amap, drones, events]);

  // 调度动画：监听 events 中 status='dispatching' 的事件
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    const dispatchingEvents = events.filter((e) => e.status === 'dispatching' && e.droneId);
    const currentIds = new Set(dispatchingEvents.map((e) => e.id));

    dispatchingEvents.forEach((evt) => {
      if (prevDispatchingRef.current.has(evt.id)) return;

      const drone = drones.find((d) => d.id === evt.droneId);
      if (!drone) return;

      const from = drone.coordinates;
      const to = evt.coordinates;

      // 创建轨迹虚线
      const polyline = new AMap.Polyline({
        path: [from, to],
        strokeColor: '#FFD700',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        strokeStyle: 'dashed',
        showDir: true,
      });
      polyline.setMap(amap);

      // 飞行动画：AMap 2.0 WebGL 中 custom content marker 的 setPosition 不触发重绘
      // 因此采用移除后在新位置重建的方式实现动画
      const duration = 4000;
      const frameInterval = 50; // 20fps
      const startTime = Date.now();
      let prevMarker: any = null;
      let animFrame: number = 0;

      const tick = () => {
        animFrame++;
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const lng = from[0] + (to[0] - from[0]) * eased;
        const lat = from[1] + (to[1] - from[1]) * eased;

        // 移除上一帧的临时 marker
        if (prevMarker) {
          prevMarker.setMap(null);
        }

        if (t < 1) {
          // 在新位置创建临时 marker
          prevMarker = new AMap.Marker({
            position: [lng, lat],
            content: '<div style="font-size:20px;text-align:center;filter:drop-shadow(0 0 4px #FFD700);">✈️</div>',
            offset: new AMap.Pixel(-12, -12),
            zIndex: 200,
          });
          prevMarker.setMap(amap);
          setTimeout(tick, frameInterval);
        }
      };
      tick();

      // 动画完成后清理
      setTimeout(() => {
        if (prevMarker) prevMarker.setMap(null);
        polyline.setMap(null);
      }, duration + 200);
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
