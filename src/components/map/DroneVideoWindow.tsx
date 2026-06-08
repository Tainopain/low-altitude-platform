import { useState } from 'react';
import { Button, Space } from 'antd';
import { CloseOutlined, ExpandOutlined, AudioOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useDroneStore } from '../../stores/droneStore';

export function DroneVideoWindow() {
  const { videoWindow, hideVideoWindow } = useUIStore();
  const drones = useDroneStore((s) => s.drones);
  const [expanded, setExpanded] = useState(false);
  if (!videoWindow.visible) return null;

  const drone = drones.find((d) => d.id === videoWindow.droneId);

  const width = expanded ? 720 : 360;
  const height = expanded ? 480 : 240;

  return (
    <div
      style={{
        position: 'absolute', bottom: 48, right: 16, zIndex: 200,
        width, height,
        background: '#161B22', borderRadius: 8, border: '1px solid #30363D',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        transition: 'width 0.3s, height 0.3s',
      }}
    >
      {/* Title Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', background: '#21262D', cursor: 'move',
      }}>
        <Space>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F85149', display: 'inline-block' }} />
          <span style={{ fontWeight: 600, fontSize: 12, color: '#E6EDF3' }}>
            {drone?.name || videoWindow.droneId} 📹 LIVE
          </span>
        </Space>
        <Space>
          <Button type="text" size="small" icon={<AudioOutlined />} style={{ color: '#8B949E' }} />
          <Button type="text" size="small" icon={<ExpandOutlined />} style={{ color: '#8B949E' }} onClick={() => setExpanded(!expanded)} />
          <Button type="text" size="small" icon={<CloseOutlined />} style={{ color: '#8B949E' }} onClick={hideVideoWindow} />
        </Space>
      </div>

      {/* Video Content — MVP 使用占位截图 */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0D1117', color: '#8B949E', fontSize: 14,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚁</div>
          <div>4K 实时画面</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            {drone?.coordinates ? `${drone.coordinates[1].toFixed(4)}, ${drone.coordinates[0].toFixed(4)}` : ''} 上空 85m
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ padding: '4px 12px', fontSize: 11, color: '#8B949E', borderTop: '1px solid #30363D' }}>
        电量 {drone?.battery ?? '—'}% · 图传码率 8.2 Mbps
      </div>
    </div>
  );
}
