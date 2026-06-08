import { Row, Col, Card, Statistic } from 'antd';
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

  const cardStyle = { textAlign: 'center' as const };

  return (
    <Row gutter={[8, 8]} style={{ padding: '8px 8px 0' }}>
      <Col span={12}>
        <Card size="small" style={cardStyle}>
          <Statistic
            title={<span><AlertOutlined style={{ color: '#F85149' }} /> 今日事件</span>}
            value={events.length}
            formatter={(v) => <CountUp end={Number(v)} />}
            valueStyle={{ fontSize: 26, fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card
          size="small"
          style={{
            ...cardStyle,
            ...(highRiskPending ? { animation: 'pulse-border 1s infinite', borderColor: '#F85149' } : {}),
          }}
        >
          <Statistic
            title={<span><ClockCircleOutlined /> 待处理</span>}
            value={pendingCount}
            formatter={(v) => <CountUp end={Number(v)} />}
            valueStyle={{ fontSize: 26, fontWeight: 700, color: highRiskPending ? '#F85149' : undefined }}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small" style={cardStyle}>
          <Statistic
            title={<span><SendOutlined style={{ color: '#3FB950' }} /> 在线无人机</span>}
            value={onlineDrones}
            suffix={`/ ${drones.length}`}
            valueStyle={{ fontSize: 26, fontWeight: 700 }}
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small" style={cardStyle}>
          <Statistic
            title={<span><CameraOutlined style={{ color: '#3FB950' }} /> 摄像头</span>}
            value="4/4"
            valueStyle={{ fontSize: 26, fontWeight: 700 }}
          />
        </Card>
      </Col>
    </Row>
  );
}
