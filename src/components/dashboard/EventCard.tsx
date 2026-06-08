import { Button, Space, Typography } from 'antd';
import { SendOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { HighwayEvent } from '../../types/event';
import { EVENT_LEVEL_CONFIG, EVENT_TYPE_LABELS } from '../../types/event';
import { LevelBadge } from '../shared/LevelBadge';
import { StatusTag } from '../shared/StatusTag';
import { useEventStore } from '../../stores/eventStore';
import { useDroneStore } from '../../stores/droneStore';
import { useUIStore } from '../../stores/uiStore';

interface Props { event: HighwayEvent; style?: React.CSSProperties; }

export function EventCard({ event, style }: Props) {
  const updateEvent = useEventStore((s) => s.updateEvent);
  const drones = useDroneStore((s) => s.drones);
  const showVideoWindow = useUIStore((s) => s.showVideoWindow);
  const cfg = EVENT_LEVEL_CONFIG[event.level];

  const timeStr = new Date(event.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const handleConfirm = () => updateEvent(event.id, { status: 'confirmed', confirmedBy: '值班员' });
  const handleClose = () => updateEvent(event.id, { status: 'closed' });
  const handleDispatch = () => {
    const standbyDrone = drones.find((d) => d.status === 'standby');
    if (!standbyDrone) return;
    const droneId = standbyDrone.id;
    updateEvent(event.id, { status: 'dispatching', droneId });
    // Simulate arrival after 4 seconds
    setTimeout(() => {
      updateEvent(event.id, { status: 'arrived' });
    }, 4000);
  };

  const isDispatchable = event.status === 'pending' || event.status === 'confirmed';

  return (
    <div
      style={{
        padding: '10px 12px',
        background: cfg.bgColor,
        borderLeft: `4px solid ${cfg.color}`,
        borderBottom: '1px solid #30363D',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <LevelBadge level={event.level} />
        <Typography.Text strong style={{ color: '#E6EDF3', fontSize: 13 }}>
          {EVENT_TYPE_LABELS[event.type]}
        </Typography.Text>
        <Tag style={{ marginLeft: 'auto', fontSize: 11 }}>{event.confidence}%</Tag>
      </div>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {event.roadName} {event.stakeNumber} {event.direction}
        <span style={{ float: 'right' }}>{timeStr}</span>
      </Typography.Text>

      <div style={{ color: '#8B949E', fontSize: 12, marginTop: 2 }}>
        {event.source === 'camera' ? '📷' : '✈️'} {event.sourceDetail}
        {event.status !== 'pending' && <StatusTag status={event.status} />}
      </div>

      <Space style={{ marginTop: 6 }}>
        {event.status === 'pending' && (
          <Button size="small" type="primary" ghost icon={<CheckOutlined />} onClick={handleConfirm}>确认</Button>
        )}
        {isDispatchable && (
          <Button
            size="small"
            type="primary"
            danger
            ghost
            icon={<SendOutlined />}
            onClick={handleDispatch}
            loading={event.status === 'dispatching'}
          >
            {event.status === 'dispatching' ? '抵近中...' : '调度🚁'}
          </Button>
        )}
        {event.status === 'arrived' && (
          <Button size="small" type="primary" onClick={() => showVideoWindow(event.droneId!)}>
            查看画面
          </Button>
        )}
        {event.status !== 'closed' && (
          <Button size="small" icon={<CloseOutlined />} onClick={handleClose}>关闭</Button>
        )}
      </Space>
    </div>
  );
}

// Helper: inline Tag (avoid import cycle)
function Tag({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ display: 'inline-block', padding: '0 6px', borderRadius: 4, fontSize: 11, background: '#30363D', color: '#8B949E', ...style }}>{children}</span>;
}
