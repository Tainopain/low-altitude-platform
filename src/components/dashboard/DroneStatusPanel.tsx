import { Card, Progress, Tag, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useDroneStore } from '../../stores/droneStore';
import { DRONE_STATUS_CONFIG } from '../../types/drone';

export function DroneStatusPanel() {
  const drones = useDroneStore((s) => s.drones);
  const flyingCount = drones.filter((d) => d.status === 'flying').length;
  const standbyCount = drones.filter((d) => d.status === 'standby').length;

  return (
    <div style={{ padding: '8px 8px 8px 0', display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'auto' }}>
      {/* 汇总 */}
      <Card size="small" styles={{ body: { padding: '10px 12px' } }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#E6EDF3' }}>
          <SendOutlined style={{ color: '#3FB950', marginRight: 6 }} />
          无人机状态
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#8B949E' }}>
          <span>在空: <b style={{ color: '#3FB950' }}>{flyingCount}</b> 架</span>
          <span>待命: <b style={{ color: '#D29922' }}>{standbyCount}</b> 架</span>
          <span>共: <b>{drones.length}</b> 架</span>
        </div>
      </Card>

      {/* 每架无人机详情 */}
      {drones.map((drone) => {
        const cfg = DRONE_STATUS_CONFIG[drone.status];
        const isFlight = drone.status === 'flying' || drone.status === 'standby';
        return (
          <Card key={drone.id} size="small" styles={{ body: { padding: '10px 12px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Typography.Text strong style={{ fontSize: 13, color: '#E6EDF3' }}>
                {drone.name}
              </Typography.Text>
              <Tag color={cfg.color} style={{ fontSize: 11, margin: 0 }}>{cfg.label}</Tag>
            </div>
            <div style={{ fontSize: 12, color: '#8B949E', marginBottom: 6 }}>
              {drone.task}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Progress
                percent={drone.battery}
                size="small"
                strokeColor={drone.battery > 50 ? '#3FB950' : drone.battery > 20 ? '#D29922' : '#F85149'}
                style={{ flex: 1, margin: 0 }}
                format={() => `${drone.battery}%`}
              />
              {isFlight && (
                <span style={{ fontSize: 11, color: '#8B949E', whiteSpace: 'nowrap' }}>
                  {drone.speed}km/h
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
