import { useEffect, useRef, useState, useCallback } from 'react';
import { Spin } from 'antd';
import { useAMap } from '../../hooks/useAMap';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { useUIStore } from '../../stores/uiStore';
import { useThemeColors } from '../../theme';
import { MapToolbar } from './MapToolbar';
import { DroneVideoWindow } from './DroneVideoWindow';

// 重庆主城 9 立交监控点（实地标定 GCJ-02 坐标）
const MONITOR_POINTS = [
  { name: '北环立交',   lng: 106.497385, lat: 29.609658 },
  { name: '石马河立交', lng: 106.471885, lat: 29.584855 },
  { name: '东环立交',   lng: 106.551681, lat: 29.620295 },
  { name: '四公里立交', lng: 106.575596, lat: 29.514190 },
  { name: '江南立交',   lng: 106.592240, lat: 29.530410 },
  { name: '凤中立交',   lng: 106.447897, lat: 29.498872 },
  { name: '西环立交',   lng: 106.441436, lat: 29.517380 },
  { name: '高滩岩立交', lng: 106.443702, lat: 29.539939 },
  { name: '杨公桥立交', lng: 106.453861, lat: 29.564296 },
];
const CENTER: [number, number] = [106.515, 29.562];

export function AMapContainer() {
  const { amap, loaded, error } = useAMap({ containerId: 'amap-container', center: CENTER, zoom: 11 });

  // 开发模式下暴露 AMap 实例 + 点击捕获 + 浮动坐标面板
  const coordPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!amap) return;
    const win = window as any;
    win.__amap = amap;
    win.__amapClickCoords = [];
    // AMap 2.0 使用 map.on('click') 而非 AMap.event.addListener
    amap.on('click', (e: any) => {
      const lng = parseFloat(e.lnglat.lng.toFixed(6));
      const lat = parseFloat(e.lnglat.lat.toFixed(6));
      const c = { lng, lat };
      win.__amapClickCoords.push(c);
      if (win.__amapClickCoords.length > 20) win.__amapClickCoords.shift();
      win.__lastClick = c;
      if (coordPanelRef.current) {
        coordPanelRef.current.textContent = `📍 ${lng}, ${lat}`;
      }
    });
  }, [amap]);
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const theme = useUIStore((s) => s.theme);
  const t = useThemeColors();
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);
  const trailPositionsRef = useRef<Map<string, Array<[number, number]>>>(new Map());
  const heatmapRef = useRef<any>(null);

  // 热力图开关
  const [showHeatmap, setShowHeatmap] = useState(false);
  const toggleHeatmap = useCallback(() => setShowHeatmap((v) => !v), []);

  // 地图缩放级别（用于动态网格聚合）
  const [zoom, setZoom] = useState(11);
  useEffect(() => {
    if (!amap) return;
    setZoom(amap.getZoom());
    const handler = () => setZoom(amap.getZoom());
    amap.on('zoomchange', handler);
    return () => amap.off('zoomchange', handler);
  }, [amap]);

  // 热力图图层
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    if (!showHeatmap) {
      if (heatmapRef.current) { heatmapRef.current.setMap(null); heatmapRef.current = null; }
      return;
    }

    // 聚合事件坐标
    const coordMap = new Map<string, { lng: number; lat: number; count: number }>();
    events.forEach((evt) => {
      const [lng, lat] = evt.coordinates;
      const key = `${lng.toFixed(3)},${lat.toFixed(3)}`;
      if (coordMap.has(key)) {
        coordMap.get(key)!.count += evt.level === 'high' ? 3 : evt.level === 'medium' ? 2 : 1;
      } else {
        coordMap.set(key, { lng, lat, count: evt.level === 'high' ? 3 : evt.level === 'medium' ? 2 : 1 });
      }
    });
    const heatData = Array.from(coordMap.values());

    const create = () => {
      if (heatmapRef.current) { heatmapRef.current.setMap(null); }
      heatmapRef.current = new AMap.HeatMap(amap, {
        radius: 35,
        opacity: [0, 0.6],
        gradient: { '0.1': '#79C0FF', '0.4': '#3FB950', '0.6': '#D29922', '0.8': '#F85149', '0.95': '#8B0000' },
        zooms: [4, 18],
      });
      heatmapRef.current.setDataSet({ data: heatData, max: 10 });
    };

    if (AMap.HeatMap) { create(); } else { AMap.plugin(['AMap.HeatMap'], create); }
  }, [amap, events, showHeatmap]);

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

  // 9 个监控点标记
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    markersRef.current.forEach((m, key) => { if (key.startsWith('monitor_')) m.setMap(null); });

    MONITOR_POINTS.forEach((pt) => {
      const marker = new AMap.Marker({
        position: [pt.lng, pt.lat],
        content: '<div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(88,166,255,0.15);border:2px solid #58A6FF;border-radius:50%;box-shadow:0 0 8px rgba(88,166,255,0.3);">📷</div>',
        offset: new AMap.Pixel(-11, -11),
        zIndex: 60,
      });
      marker.on('click', () => {
        const content = `<b>📷 ${pt.name}</b><br/>
          <span style="color:${t.muted}">位置: ${pt.lat.toFixed(3)}°N, ${pt.lng.toFixed(3)}°E</span><br/>
          <span style="color:${t.muted}">状态: 监控中</span>`;
        showInfo(AMap, [pt.lng, pt.lat], content);
      });
      marker.setMap(amap);
      markersRef.current.set(`monitor_${pt.name}`, marker);
    });
  }, [amap, theme]);

  // 点击地图空白区域关闭 InfoWindow
  useEffect(() => {
    if (!amap) return;
    const closeInfo = () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
    amap.on('click', closeInfo);
    return () => { amap.off('click', closeInfo); };
  }, [amap]);

  // 4 机舱标记 + 5km 覆盖圈
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    markersRef.current.forEach((m, key) => { if (key.startsWith('hangar_') || key.startsWith('cover_')) m.setMap(null); });

    const seen = new Set<string>();
    drones.forEach((drone) => {
      const posKey = `${drone.homePosition[0]}_${drone.homePosition[1]}`;
      if (seen.has(posKey)) return;
      seen.add(posKey);

      // 5km 覆盖圈（半透明填充 + 实线边框，确保可见）
      const circle = new AMap.Circle({
        center: drone.homePosition,
        radius: 5000,
        strokeColor: '#3FB950',
        strokeWeight: 2,
        strokeOpacity: 0.6,
        fillColor: '#3FB950',
        fillOpacity: 0.08,
      });
      circle.setMap(amap);
      markersRef.current.set(`cover_${drone.id}`, circle);

      // 机舱标记
      const marker = new AMap.Marker({
        position: drone.homePosition,
        content: '<div style="font-size:24px;text-align:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🏠</div>',
        offset: new AMap.Pixel(-14, -14),
        zIndex: 80,
      });
      const dronesHere = drones.filter((d) => d.homePosition[0] === drone.homePosition[0] && d.homePosition[1] === drone.homePosition[1]);
      marker.on('click', () => {
        const list = dronesHere.map((d) => `${d.name} · ${d.task}`).join('<br/>');
        const content = `<b>🏠 ${drone.name}</b><br/>
          ${list}<br/>
          <span style="color:#3FB950">覆盖半径: 5km</span> &nbsp;
          <span style="color:${t.muted}">${drone.homePosition[1].toFixed(4)}°, ${drone.homePosition[0].toFixed(4)}°</span>`;
        showInfo(AMap, drone.homePosition, content);
      });
      marker.setMap(amap);
      markersRef.current.set(`hangar_${drone.id}`, marker);
    });
  }, [amap, drones, theme]);

  // 同步事件 Markers（自定义网格聚合，避免依赖 MarkerClusterer 插件）
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    // 清理旧标记
    markersRef.current.forEach((m, key) => { if (key.startsWith('evt_') || key.startsWith('grid_')) m.setMap(null); });

    const activeEvents = events.filter((e) => e.status !== 'closed' && e.status !== 'resolved');
    if (activeEvents.length === 0) return;

    // 动态网格：zoom 越大格子越小
    const GRID = zoom >= 15 ? 0.0005 : zoom >= 13 ? 0.002 : zoom >= 10 ? 0.005 : 0.02;
    const grid = new Map<string, { events: typeof activeEvents; lng: number; lat: number; highCount: number }>();

    activeEvents.forEach((evt) => {
      const glng = Math.round(evt.coordinates[0] / GRID) * GRID;
      const glat = Math.round(evt.coordinates[1] / GRID) * GRID;
      const key = `${glng.toFixed(3)},${glat.toFixed(3)}`;
      if (!grid.has(key)) {
        grid.set(key, { events: [], lng: glng, lat: glat, highCount: 0 });
      }
      const cell = grid.get(key)!;
      cell.events.push(evt);
      if (evt.level === 'high') cell.highCount++;
    });

    grid.forEach((cell) => {
      const count = cell.events.length;
      const hasHigh = cell.highCount > 0;
      const color = hasHigh ? '#F85149' : count >= 3 ? '#D29922' : '#58A6FF';
      const pulseClass = hasHigh ? 'marker-pulse' : '';
      const size = count >= 5 ? 22 : count >= 3 ? 18 : 14;

      const marker = new AMap.Marker({
        position: [cell.lng, cell.lat],
        content: count > 1
          ? `<div class="${pulseClass}" style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${color}44;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700;">${count}</div>`
          : `<div class="${pulseClass}" style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${color}44;"></div>`,
        offset: new AMap.Pixel(-size / 2, -size / 2),
        zIndex: count >= 5 ? 120 : count >= 3 ? 110 : 100,
      });

      marker.on('click', () => {
        if (count === 1) {
          const evt = cell.events[0];
          const timeStr = new Date(evt.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
          const hasScreenshot = evt.screenshot && evt.screenshot.length > 0;
          const imgHtml = hasScreenshot
            ? `<div style="margin:6px 0;border-radius:4px;overflow:hidden;background:#000;"><img src="${evt.screenshot}" style="width:100%;max-height:120px;object-fit:cover;display:block;" onerror="this.style.display='none'"/></div>`
            : '';
          const levelLabel = evt.level === 'high' ? '高危' : evt.level === 'medium' ? '中危' : '低危';
          const content = `<b style="color:${color}">${levelLabel} · ${evt.type}</b><br/>
            路段: ${evt.roadName} ${evt.stakeNumber}<br/>
            置信度: ${evt.confidence}% &nbsp; 来源: ${evt.source === 'camera' ? '📷' : '✈️'} ${evt.sourceDetail}<br/>
            ${imgHtml}
            <span style="color:${t.muted}">时间: ${timeStr}</span><br/>
            <a href="/event/${evt.id}" style="color:${t.link};text-decoration:none;font-weight:500;"
               onclick="event.preventDefault();window.history.pushState(null,'','/event/${evt.id}');window.dispatchEvent(new PopStateEvent('popstate'));">
              查看详情 →
            </a>`;
          showInfo(AMap, [cell.lng, cell.lat], content);
        } else {
          // 聚合点：列出所有事件
          const items = cell.events.slice(0, 5).map((e) => {
            const ll = e.level === 'high' ? '🔴' : e.level === 'medium' ? '🟡' : '🔵';
            const t = new Date(e.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            return `${ll} <a href="/event/${e.id}" style="color:${t.link};text-decoration:none;"
              onclick="event.preventDefault();window.history.pushState(null,'','/event/${e.id}');window.dispatchEvent(new PopStateEvent('popstate'));">${e.type} @ ${e.stakeNumber} ${t}</a>`;
          }).join('<br/>');
          const more = count > 5 ? `<br/><span style="color:${t.muted}">... 还有 ${count - 5} 起事件</span>` : '';
          const content = `<b style="color:${color}">📍 ${count} 起事件聚合</b><br/><br/>${items}${more}
            <br/><span style="color:${t.muted};font-size:10px;">放大缩小地图可展开/合并标记</span>`;
          showInfo(AMap, [cell.lng, cell.lat], content);
        }
      });

      marker.setMap(amap);
      markersRef.current.set(`grid_${cell.lng.toFixed(3)}_${cell.lat.toFixed(3)}`, marker);
    });
  }, [amap, events, theme, zoom]);

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

  // 巡逻轨迹尾迹
  useEffect(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;
    if (!AMap) return;

    const trailLen = 25;
    const trails = trailPositionsRef.current;

    drones.forEach((drone) => {
      if (drone.status !== 'flying') {
        // 非飞行状态：清除尾迹
        const key = `trail_${drone.id}`;
        const old = markersRef.current.get(key);
        if (old) { old.setMap(null); markersRef.current.delete(key); }
        trails.delete(drone.id);
        return;
      }

      // 正在调度中的无人机不显示尾迹（由飞行动画处理）
      const dispatching = events.some((e) =>
        (e.status === 'dispatching' || e.status === 'arrived') && e.droneId === drone.id
      );
      if (dispatching) return;

      // 追加新位置（去重相邻同点）
      let posList = trails.get(drone.id) || [];
      const last = posList[posList.length - 1];
      if (!last || last[0] !== drone.coordinates[0] || last[1] !== drone.coordinates[1]) {
        posList = [...posList.slice(-(trailLen - 1)), [...drone.coordinates]];
        trails.set(drone.id, posList);
      }

      if (posList.length < 2) return;

      const key = `trail_${drone.id}`;
      const old = markersRef.current.get(key);
      if (old) old.setMap(null);

      const line = new AMap.Polyline({
        path: posList,
        strokeColor: '#3FB950',
        strokeWeight: 2,
        strokeOpacity: 0.35,
        strokeStyle: 'solid',
        lineCap: 'round',
        zIndex: 50,
      });
      line.setMap(amap);
      markersRef.current.set(key, line);
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
        <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.8 }}>{error}</div>
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
      {loaded && <MapToolbar amap={amap} center={CENTER} showHeatmap={showHeatmap} onToggleHeatmap={toggleHeatmap} />}
      <DroneVideoWindow />
      {/* 调试：点击地图显示坐标 */}
      <div ref={coordPanelRef} style={{
        position: 'absolute', bottom: 16, right: 60, zIndex: 200,
        background: 'rgba(0,0,0,0.8)', color: '#58A6FF',
        padding: '6px 12px', borderRadius: 6, fontFamily: 'monospace',
        fontSize: 12, pointerEvents: 'none',
      }}>
        点击地图获取坐标
      </div>
    </div>
  );
}
