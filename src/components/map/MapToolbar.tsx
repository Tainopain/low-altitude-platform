import { useState, useRef, useCallback } from 'react';
import { FloatButton } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  AimOutlined,
  FullscreenOutlined,
  GlobalOutlined,
  LineChartOutlined,
  FireOutlined,
} from '@ant-design/icons';

/** 地图样式循环：深色 → 浅色 → 卫星 → 循环 */
const MAP_STYLES = [
  { key: 'dark', label: '深色地图', style: 'amap://styles/dark' },
  { key: 'light', label: '浅色地图', style: 'amap://styles/light' },
  { key: 'satellite', label: '卫星地图', style: 'satellite' as const },
];

interface MapToolbarProps {
  amap: any;
  center: [number, number];
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
}

export function MapToolbar({ amap, center, showHeatmap, onToggleHeatmap }: MapToolbarProps) {
  const [styleIdx, setStyleIdx] = useState(0);
  const [measuring, setMeasuring] = useState(false);
  const rangingRef = useRef<any>(null);

  // 切换地图样式（深色 → 浅色 → 卫星 → 循环）
  const toggleMapStyle = useCallback(() => {
    if (!amap) return;
    const next = (styleIdx + 1) % MAP_STYLES.length;
    setStyleIdx(next);

    const AMap = (window as any).AMap;
    const target = MAP_STYLES[next];

    if (target.style === 'satellite') {
      // 卫星图：通过 setFeatures + setMapStyle 组合实现
      amap.setFeatures(['bg', 'road', 'point']);
      try {
        if (AMap.TileLayer?.Satellite) {
          new AMap.TileLayer.Satellite().setMap(amap);
        }
        if (AMap.TileLayer?.RoadNet) {
          new AMap.TileLayer.RoadNet().setMap(amap);
        }
      } catch { /* fallback to default features */ }
    } else {
      amap.setMapStyle(target.style);
      amap.setFeatures(['bg', 'road', 'point']);
    }
  }, [amap, styleIdx]);

  // 测距工具开关
  const toggleRanging = useCallback(() => {
    if (!amap) return;
    const AMap = (window as any).AMap;

    if (measuring) {
      // 关闭测距
      if (rangingRef.current) {
        rangingRef.current.turnOff();
        rangingRef.current = null;
      }
      setMeasuring(false);
    } else {
      // 加载并开启测距
      const startRanging = () => {
        const tool = new AMap.RangingTool(amap, {
          lineOptions: {
            strokeColor: '#58A6FF',
            strokeWeight: 2,
            strokeStyle: 'dashed',
          },
        });
        tool.turnOn();
        rangingRef.current = tool;
        setMeasuring(true);
      };

      if (AMap.RangingTool) {
        startRanging();
      } else {
        AMap.plugin(['AMap.RangingTool'], startRanging);
      }
    }
  }, [amap, measuring]);

  const currentStyle = MAP_STYLES[styleIdx];

  return (
    <FloatButton.Group
      shape="circle"
      style={{ position: 'absolute', right: 12, top: 60, zIndex: 100 }}
    >
      <FloatButton
        icon={<ZoomInOutlined />}
        tooltip="放大"
        onClick={() => amap?.zoomIn()}
      />
      <FloatButton
        icon={<ZoomOutOutlined />}
        tooltip="缩小"
        onClick={() => amap?.zoomOut()}
      />
      <FloatButton
        icon={<AimOutlined />}
        tooltip="回到中心"
        onClick={() => amap?.setCenter(center)}
      />
      <FloatButton
        icon={<GlobalOutlined />}
        tooltip={currentStyle.label}
        type={styleIdx === 2 ? 'primary' : 'default'}
        onClick={toggleMapStyle}
      />
      <FloatButton
        icon={<LineChartOutlined />}
        tooltip={measuring ? '关闭测距' : '测距'}
        type={measuring ? 'primary' : 'default'}
        onClick={toggleRanging}
      />
      {onToggleHeatmap && (
        <FloatButton
          icon={<FireOutlined />}
          tooltip={showHeatmap ? '关闭热力图' : '热力图'}
          type={showHeatmap ? 'primary' : 'default'}
          onClick={onToggleHeatmap}
        />
      )}
      <FloatButton
        icon={<FullscreenOutlined />}
        tooltip="全屏"
        onClick={() => document.getElementById('amap-container')?.requestFullscreen?.()}
      />
    </FloatButton.Group>
  );
}
