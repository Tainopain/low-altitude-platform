import { useEffect, useRef, useState } from 'react';
import { Spin, Alert, FloatButton } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, AimOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useAMap } from '../../hooks/useAMap';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { MapLegend } from './MapLegend';
import { DroneVideoWindow } from './DroneVideoWindow';

// 试点路段 G50 中点坐标（重庆附近，Demo 用）
const CENTER: [number, number] = [106.530, 29.540];

export function AMapContainer() {
  const { amap, loaded, error } = useAMap({ containerId: 'amap-container', center: CENTER, zoom: 11 });
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [keyWarningDismissed, setKeyWarningDismissed] = useState(false);

  // G50 高速公路 + 巡逻路线
  const G50_ROUTE: Array<[number, number]> = [
    [106.490, 29.475], [106.500, 29.480], [106.510, 29.485],
    [106.520, 29.492], [106.530, 29.500], [106.540, 29.508],
    [106.550, 29.515], [106.560, 29.520], [106.570, 29.510],
    [106.575, 29.500], [106.570, 29.490], [106.560, 29.482],
    [106.550, 29.478], [106.540, 29.476], [106.530, 29.478],
    [106.520, 29.482], [106.510, 29.488], [106.500, 29.485],
  ];

  // 绘制 G50 高速路线 + 巡逻航线
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    // G50 高速公路（粗实线）
    const highway = new AMap.Polyline({
      path: G50_ROUTE,
      strokeColor: '#58A6FF',
      strokeWeight: 4,
      strokeOpacity: 0.5,
      strokeStyle: 'solid',
    });
    highway.setMap(amap);
    markersRef.current.set('g50_highway', highway);

    // 巡逻航线（虚线）
    const patrolLine = new AMap.Polyline({
      path: G50_ROUTE,
      strokeColor: '#3FB950',
      strokeWeight: 2,
      strokeOpacity: 0.4,
      strokeStyle: 'dashed',
      strokeDasharray: [8, 12],
    });
    patrolLine.setMap(amap);
    markersRef.current.set('g50_patrol', patrolLine);
  }, [amap]);

  // 初始化机舱 Markers（每架无人机对应一个机舱，一对一）
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    // 清理旧机舱 markers
    markersRef.current.forEach((m, key) => { if (key.startsWith('hangar_')) m.setMap(null); });

    // 去重：不同无人机可能共享同一机舱位置
    const seen = new Set<string>();
    drones.forEach((drone) => {
      const key = `${drone.homePosition[0]}_${drone.homePosition[1]}`;
      if (seen.has(key)) return;
      seen.add(key);

      const marker = new AMap.Marker({
        position: drone.homePosition,
        content: '<div style="font-size:20px;text-align:center;">🏠</div>',
        offset: new AMap.Pixel(-12, -12),
      });
      marker.setMap(amap);
      markersRef.current.set(`hangar_${drone.id}`, marker);
    });
  }, [amap, drones]);

  // 同步事件 Markers
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

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

  const isSameCoords = (a: [number, number], b: [number, number]) =>
    a[0] === b[0] && a[1] === b[1];

  // 同步无人机 Markers（停靠在机舱时隐藏，飞行中由动画渲染）
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    const oldKeys: string[] = [];
    markersRef.current.forEach((m, key) => { if (key.startsWith('drone_')) { m.setMap(null); oldKeys.push(key); } });
    oldKeys.forEach((k) => markersRef.current.delete(k));

    // 正在飞行任务中的无人机 ID
    const flyingDroneIds = new Set(
      events.filter((e) => (e.status === 'dispatching' || e.status === 'arrived') && e.droneId).map((e) => e.droneId!)
    );

    drones.forEach((drone) => {
      if (drone.status === 'offline') return;
      // 飞行任务中的无人机由动画负责渲染
      if (flyingDroneIds.has(drone.id)) return;
      // 停靠在自己机舱位置时隐藏（只显示机舱图标）
      if (isSameCoords(drone.coordinates, drone.homePosition)) return;

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

  // 计算方位角（0-360，正北为0）
  const bearing = (from: [number, number], to: [number, number]) => {
    const dLng = (to[0] - from[0]) * Math.PI / 180;
    const radLat1 = from[1] * Math.PI / 180;
    const radLat2 = to[1] * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(radLat2);
    const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  const flightMarkerHTML = (heading: number) =>
    `<div style="font-size:20px;text-align:center;filter:drop-shadow(0 0 6px #FFD700);transform:rotate(${heading}deg);">✈️</div>`;

  // 沿路径飞行动画（destroy-recreate，兼容 AMap 2.0 WebGL）
  const animateFlight = (
    path: Array<[number, number]>,
    durationMs: number,
    onDone: () => void,
  ) => {
    const frameInterval = 50;
    const startTime = Date.now();
    let prevMarker: any = null;
    let polyline: any = null;

    polyline = new (window as any).AMap.Polyline({
      path,
      strokeColor: '#FFD700',
      strokeWeight: 3,
      strokeOpacity: 0.7,
      strokeStyle: 'dashed',
      showDir: true,
    });
    polyline.setMap(amap);

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const segCount = path.length - 1;
      const totalT = eased * segCount;
      const segIdx = Math.min(Math.floor(totalT), segCount - 1);
      const segT = totalT - segIdx;
      const segFrom = path[segIdx];
      const segTo = path[segIdx + 1];
      const lng = segFrom[0] + (segTo[0] - segFrom[0]) * segT;
      const lat = segFrom[1] + (segTo[1] - segFrom[1]) * segT;
      const dir = bearing(segFrom, segTo);

      if (prevMarker) prevMarker.setMap(null);

      if (t < 1) {
        prevMarker = new (window as any).AMap.Marker({
          position: [lng, lat],
          content: flightMarkerHTML(dir),
          offset: new (window as any).AMap.Pixel(-13, -13),
          zIndex: 200,
        });
        prevMarker.setMap(amap);
        setTimeout(tick, frameInterval);
      } else {
        prevMarker = new (window as any).AMap.Marker({
          position: path[path.length - 1],
          content: flightMarkerHTML(bearing(path[path.length - 2], path[path.length - 1])),
          offset: new (window as any).AMap.Pixel(-13, -13),
          zIndex: 200,
        });
        prevMarker.setMap(amap);

        setTimeout(() => {
          if (prevMarker) prevMarker.setMap(null);
          if (polyline) polyline.setMap(null);
        }, 2000);

        onDone();
      }
    };
    tick();

    return () => {
      if (polyline) polyline.setMap(null);
    };
  };

  // 调度动画：dispatching → 飞向事件，arrived → 返回所属机舱
  const animatingRef = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    if (!amap) return;

    // 出发
    const dispatchingEvents = events.filter((e) => e.status === 'dispatching' && e.droneId);
    dispatchingEvents.forEach((evt) => {
      if (animatingRef.current.has(`out_${evt.id}`)) return;

      const drone = drones.find((d) => d.id === evt.droneId);
      if (!drone) return;

      const cancel = animateFlight(
        [drone.coordinates, evt.coordinates],
        8000,
        () => animatingRef.current.delete(`out_${evt.id}`),
      );
      animatingRef.current.set(`out_${evt.id}`, cancel);
    });

    // 返航：回到无人机自己的机舱位置
    const arrivedEvents = events.filter((e) => e.status === 'arrived' && e.droneId);
    arrivedEvents.forEach((evt) => {
      if (animatingRef.current.has(`back_${evt.id}`)) return;
      if (animatingRef.current.has(`out_${evt.id}`)) return;

      const drone = drones.find((d) => d.id === evt.droneId);
      if (!drone) return;

      const cancel = animateFlight(
        [evt.coordinates, drone.homePosition],
        8000,
        () => animatingRef.current.delete(`back_${evt.id}`),
      );
      animatingRef.current.set(`back_${evt.id}`, cancel);
    });
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
      {loaded && (
        <FloatButton.Group shape="circle" style={{ position: 'absolute', right: 12, top: 60, zIndex: 100 }}>
          <FloatButton icon={<ZoomInOutlined />} tooltip="放大" onClick={() => amap?.zoomIn()} />
          <FloatButton icon={<ZoomOutOutlined />} tooltip="缩小" onClick={() => amap?.zoomOut()} />
          <FloatButton icon={<AimOutlined />} tooltip="回到中心" onClick={() => amap?.setCenter(CENTER)} />
          <FloatButton icon={<FullscreenOutlined />} tooltip="全屏"
            onClick={() => document.getElementById('amap-container')?.requestFullscreen?.()} />
        </FloatButton.Group>
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
