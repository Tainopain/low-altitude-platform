import { Card, Statistic } from 'antd';
import { AlertOutlined, ClockCircleOutlined, SendOutlined, CameraOutlined } from '@ant-design/icons';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { CountUp } from '../shared/CountUp';

export function KPICards() {
  const events = useEventStore((s) => s.events);
  const drones = useDroneStore((s) => s.drones);
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const highRiskPending = events.some((e) => e.level === 'high' && e.status === 'pending');
  const onlineDrones = drones.filter((d) => d.status === 'flying' || d.status === 'standby').length;

  return (
    <div style={{
      padding: '8px 0 8px 8px',
      display: 'flex', flexDirection: 'column', gap: 8,
      width: 170, flexShrink: 0,
    }}>
      <Card
        size="small"
        styles={{ body: { padding: '10px 12px' } }}
        style={highRiskPending ? { animation: 'pulse-border 1s infinite', borderColor: '#F85149' } : {}}
      >
        <Statistic
          title={<span style={{ fontSize: 12 }}><AlertOutlined style={{ color: '#F85149' }} /> 今日事件</span>}
          value={events.length}
          formatter={(v) => <CountUp end={Number(v)} />}
          styles={{ value: { fontSize: 22, fontWeight: 700 } }}
        />
      </Card>
      <Card size="small" styles={{ body: { padding: '10px 12px' } }}>
        <Statistic
          title={<span style={{ fontSize: 12 }}><ClockCircleOutlined style={{ color: pendingCount > 0 ? '#F85149' : '#8B949E' }} /> 待处理</span>}
          value={pendingCount}
          formatter={(v) => <CountUp end={Number(v)} />}
          styles={{ value: { fontSize: 22, fontWeight: 700, color: pendingCount > 0 ? '#F85149' : undefined } }}
        />
      </Card>
      <Card size="small" styles={{ body: { padding: '10px 12px' } }}>
        <Statistic
          title={<span style={{ fontSize: 12 }}><SendOutlined style={{ color: '#3FB950' }} /> 在线无人机</span>}
          value={onlineDrones}
          suffix={<span style={{ fontSize: 14 }}>/ {drones.length}</span>}
          styles={{ value: { fontSize: 22, fontWeight: 700 } }}
        />
      </Card>
      <Card size="small" styles={{ body: { padding: '10px 12px' } }}>
        <Statistic
          title={<span style={{ fontSize: 12 }}><CameraOutlined style={{ color: '#3FB950' }} /> 摄像头</span>}
          value="4/4"
          styles={{ value: { fontSize: 22, fontWeight: 700 } }}
        />
      </Card>
    </div>
  );
}
