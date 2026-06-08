import { useEffect, useRef } from 'react';
import { Spin, FloatButton } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, AimOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useAMap } from '../../hooks/useAMap';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { useUIStore } from '../../stores/uiStore';
import { MapLegend } from './MapLegend';
import { DroneVideoWindow } from './DroneVideoWindow';

// 试点路段 G50 中点坐标（重庆附近，Demo 用）
const CENTER: [number, number] = [106.530, 29.540];

// 主题色配置
const THEME = {
  dark: { bg: '#161B22', text: '#E6EDF3', border: '#30363D', link: '#58A6FF', muted: '#8B949E', shadow: 'rgba(0,0,0,0.4)' },
  light: { bg: '#FFFFFF', text: '#1F2328', border: '#D0D7DE', link: '#0969DA', muted: '#656D76', shadow: 'rgba(0,0,0,0.12)' },
} as const;

export function AMapContainer() {
  const { amap, loaded, error } = useAMap({ containerId: 'amap-container', center: CENTER, zoom: 11 });
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const theme = useUIStore((s) => s.theme);
  const t = THEME[theme];
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);

  // 主题化包裹 InfoWindow 内容（带 CSS 三角箭头）
  const wrapContent = (inner: string) =>
    `<div style="background:${t.bg};color:${t.text};border-radius:6px;padding:8px 12px;font-size:12px;line-height:1.8;box-shadow:0 2px 12px ${t.shadow};border:1px solid ${t.border};position:relative;min-width:150px;">
      ${inner}
      <div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid ${t.border};"></div>
      <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid ${t.bg};"></div>
    </div>`;

  // 显示信息窗（自定义样式，跟随主题）
  const showInfo = (AMap: any, pos: [number, number], content: string) => {
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
    const iw = new AMap.InfoWindow({
      content: wrapContent(content),
      position: pos,
      offset: new AMap.Pixel(0, -10),
      isCustom: true,
    });
    iw.open(amap);
    infoWindowRef.current = iw;
  };

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

    // 点击地图空白区域关闭 InfoWindow
    const closeInfo = () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
    amap.on('click', closeInfo);
    return () => { amap.off('click', closeInfo); };
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
      const owner = drones.filter((d) => d.homePosition[0] === drone.homePosition[0] && d.homePosition[1] === drone.homePosition[1]);
      marker.on('click', () => {
        const droneList = owner.map((d) => `${d.name} (${d.status === 'flying' ? '在空' : d.status === 'standby' ? '待命' : '充电中'})`).join('<br/>');
        const content = `<b>🏠 机舱</b><br/>
          ${droneList}<br/>
          <span style="color:${t.muted}">位置: ${drone.homePosition[1].toFixed(4)}, ${drone.homePosition[0].toFixed(4)}</span>`;
        showInfo(AMap, drone.homePosition, content);
      });
      marker.setMap(amap);
      markersRef.current.set(`hangar_${drone.id}`, marker);
    });
  }, [amap, drones, theme]);

  // 同步事件 Markers
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    markersRef.current.forEach((m, key) => { if (key.startsWith('evt_')) m.setMap(null); });

    // 已关闭/已处理的事件不在地图上显示
    events.filter((e) => e.status !== 'closed' && e.status !== 'resolved').forEach((evt) => {
      const color = evt.level === 'high' ? '#F85149' : evt.level === 'medium' ? '#D29922' : '#79C0FF';
      const levelLabel = evt.level === 'high' ? '高危' : evt.level === 'medium' ? '中危' : '低危';
      const pulseClass = evt.level === 'high' ? 'marker-pulse' : '';
      const marker = new AMap.Marker({
        position: evt.coordinates,
        content: `<div class="${pulseClass}" style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid ${color}44;"></div>`,
        offset: new AMap.Pixel(-7, -7),
      });
      const timeStr = new Date(evt.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      marker.on('click', () => {
        const content = `<b style="color:${color}">${levelLabel} · ${evt.type}</b><br/>
          路段: ${evt.roadName} ${evt.stakeNumber}<br/>
          置信度: ${evt.confidence}% &nbsp; 来源: ${evt.source === 'camera' ? '📷' : '✈️'} ${evt.sourceDetail}<br/>
          <span style="color:${t.muted}">时间: ${timeStr}</span><br/>
          <a href="/event/${evt.id}" style="color:${t.link};text-decoration:none;font-weight:500;"
             onclick="event.preventDefault();window.history.pushState(null,'','/event/${evt.id}');window.dispatchEvent(new PopStateEvent('popstate'));">
            查看详情 →
          </a>`;
        showInfo(AMap, evt.coordinates, content);
      });
      marker.setMap(amap);
      markersRef.current.set(`evt_${evt.id}`, marker);
    });
  }, [amap, events, theme]);

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
        const statusLabel = drone.status === 'flying' ? '在空' : drone.status === 'standby' ? '待命' : drone.status === 'charging' ? '充电中' : '维护';
        const batteryColor = drone.battery > 50 ? '#3FB950' : drone.battery > 20 ? '#D29922' : '#F85149';
        const content = `<b>${drone.name}</b> <span style="color:${drone.status === 'flying' ? '#3FB950' : '#D29922'}">${statusLabel}</span><br/>
          电量: <span style="color:${batteryColor}">${drone.battery}%</span> &nbsp; 速度: ${drone.speed > 0 ? drone.speed + ' km/h' : '停泊'}<br/>
          任务: ${drone.task}<br/>
          <span style="color:${t.muted}">位置: ${drone.coordinates[1].toFixed(4)}, ${drone.coordinates[0].toFixed(4)}</span>`;
        showInfo(AMap, drone.coordinates, content);
      });
      marker.setMap(amap);
      markersRef.current.set(`drone_${drone.id}`, marker);
    });
  }, [amap, drones, events, theme]);

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
    color: string = '#FFD700',
  ) => {
    const frameInterval = 50;
    const startTime = Date.now();
    let prevMarker: any = null;
    let polyline: any = null;

    polyline = new (window as any).AMap.Polyline({
      path,
      strokeColor: color,
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
        '#58A6FF',
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
      <DroneVideoWindow />
    </div>
  );
}
