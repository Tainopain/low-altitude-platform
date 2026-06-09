import { useEffect, useRef, useState } from 'react';
import { Spin, Switch, Typography } from 'antd';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useEventStore } from '../../stores/eventStore';
import { useThemeColors } from '../../theme';

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || 'a9b8cb42ec24eadd4e79505e8972aabe';

/** 热力图颜色梯度 */
const HEAT_GRADIENT: Record<string, string> = {
  '0.1': '#79C0FF',
  '0.3': '#3FB950',
  '0.5': '#D29922',
  '0.7': '#F85149',
  '0.9': '#8B0000',
};

export function EventHeatmap() {
  const events = useEventStore((s) => s.events);
  const t = useThemeColors();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const heatmapRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const initRef = useRef(false);

  // 初始化地图
  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    AMapLoader.load({ key: AMAP_KEY, version: '2.0' })
      .then((AMap: any) => {
        const map = new AMap.Map(containerRef.current!, {
          center: [106.530, 29.540],
          zoom: 11,
          resizeEnable: true,
          features: ['bg', 'road', 'point'],
          mapStyle: 'amap://styles/dark',
        });

        // G50 路线
        const G50_ROUTE: Array<[number, number]> = [
          [106.490, 29.475], [106.500, 29.480], [106.510, 29.485],
          [106.520, 29.492], [106.530, 29.500], [106.540, 29.508],
          [106.550, 29.515], [106.560, 29.520], [106.570, 29.510],
          [106.575, 29.500], [106.570, 29.490], [106.560, 29.482],
          [106.550, 29.478], [106.540, 29.476], [106.530, 29.478],
          [106.520, 29.482], [106.510, 29.488], [106.500, 29.485],
        ];
        new AMap.Polyline({
          path: G50_ROUTE, strokeColor: '#58A6FF',
          strokeWeight: 3, strokeOpacity: 0.5,
        }).setMap(map);

        mapRef.current = map;
        setLoaded(true);
      })
      .catch((e: Error) => console.warn('Heatmap map init failed:', e.message));

    return () => {
      if (mapRef.current) { mapRef.current.destroy(); mapRef.current = null; }
    };
  }, []);

  // 更新热力数据
  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const AMap = (window as any).AMap;
    if (!AMap) return;

    // 聚合事件坐标到热力数据点
    const coordMap = new Map<string, { lng: number; lat: number; count: number }>();
    events.forEach((evt) => {
      const [lng, lat] = evt.coordinates;
      // 以 0.002° (~200m) 网格聚合
      const key = `${lng.toFixed(3)},${lat.toFixed(3)}`;
      if (coordMap.has(key)) {
        coordMap.get(key)!.count += evt.level === 'high' ? 3 : evt.level === 'medium' ? 2 : 1;
      } else {
        coordMap.set(key, { lng, lat, count: evt.level === 'high' ? 3 : evt.level === 'medium' ? 2 : 1 });
      }
    });

    const heatData = Array.from(coordMap.values());

    // 移除旧热力图层
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    if (!showHeatmap || heatData.length === 0) return;

    // 加载 HeatMap 插件
    const createHeatmap = () => {
      heatmapRef.current = new AMap.HeatMap(mapRef.current, {
        radius: 30,
        opacity: [0, 0.7],
        gradient: HEAT_GRADIENT,
        zooms: [4, 18],
        rejectMapMask: false,
        visible: true,
      });
      heatmapRef.current.setDataSet({ data: heatData, max: 10 });
    };

    if (AMap.HeatMap) {
      createHeatmap();
    } else {
      AMap.plugin(['AMap.HeatMap'], createHeatmap);
    }
  }, [events, loaded, showHeatmap]);

  if (!loaded) {
    return (
      <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, borderRadius: 8 }}>
        <Spin description="加载热力图..." />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Typography.Text strong style={{ color: t.text }}>🔥 事件热力分布</Typography.Text>
        <Switch
          size="small"
          checked={showHeatmap}
          onChange={setShowHeatmap}
          checkedChildren="开"
          unCheckedChildren="关"
        />
      </div>
      <div ref={containerRef} style={{ height: 320, borderRadius: 8, overflow: 'hidden' }} />
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '4px 8px',
        display: 'flex', gap: 8, fontSize: 11, color: '#ccc',
        zIndex: 10,
      }}>
        <span><span style={{ color: '#79C0FF' }}>●</span> 低密</span>
        <span><span style={{ color: '#3FB950' }}>●</span></span>
        <span><span style={{ color: '#D29922' }}>●</span></span>
        <span><span style={{ color: '#F85149' }}>●</span></span>
        <span><span style={{ color: '#8B0000' }}>●</span> 高密</span>
      </div>
    </div>
  );
}
