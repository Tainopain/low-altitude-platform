import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Segmented, Typography, Button, Badge, Space, Switch } from 'antd';
import { MessageOutlined, HistoryOutlined } from '@ant-design/icons';
import { useEventStore } from '../../stores/eventStore';
import type { EventLevel, HighwayEvent } from '../../types/event';
import { EVENT_LEVEL_CONFIG, EVENT_TYPE_LABELS } from '../../types/event';
import { LevelBadge } from '../shared/LevelBadge';
import { StatusTag } from '../shared/StatusTag';
import { useDroneStore } from '../../stores/droneStore';
import { useUIStore } from '../../stores/uiStore';
import { useThemeColors } from '../../theme';
import { SendOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const FILTER_OPTIONS: { label: string; value: EventLevel | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '高危', value: 'high' },
  { label: '中危', value: 'medium' },
  { label: '低危', value: 'low' },
];

function EventRow({ event }: { event: HighwayEvent }) {
  const navigate = useNavigate();
  const updateEvent = useEventStore((s) => s.updateEvent);
  const drones = useDroneStore((s) => s.drones);
  const setTask = useDroneStore((s) => s.setTask);
  const setStatus = useDroneStore((s) => s.setStatus);
  const showVideoWindow = useUIStore((s) => s.showVideoWindow);
  const events = useEventStore((s) => s.events);
  const t = useThemeColors();
  const cfg = EVENT_LEVEL_CONFIG[event.level];

  const timeStr = new Date(event.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const isDispatchable = event.status === 'pending' || event.status === 'confirmed';

  const handleConfirm = () => updateEvent(event.id, { status: 'confirmed', confirmedBy: '值班员' });
  const handleClose = () => updateEvent(event.id, { status: 'closed' });
  const handleDispatch = () => {
    const busyDroneIds = new Set(
      events.filter((e) => (e.status === 'dispatching' || e.status === 'arrived') && e.droneId).map((e) => e.droneId!)
    );
    const standbyDrone = drones.find((d) => d.status === 'standby' && !busyDroneIds.has(d.id));
    if (!standbyDrone) return;
    const droneId = standbyDrone.id;
    updateEvent(event.id, { status: 'dispatching', droneId });
    setStatus(droneId, 'flying');
    setTask(droneId, `抵近中: ${event.roadName} ${event.stakeNumber}`, 80);
    setTimeout(() => {
      updateEvent(event.id, { status: 'arrived' });
      setTask(droneId, '抵近确认中', 0);
      setTimeout(() => {
        updateEvent(event.id, { status: 'resolved' });
        setStatus(droneId, 'standby');
        setTask(droneId, '待命', 0);
      }, 10000);
    }, 8000);
  };

  const rowBg = event.level === 'high' ? t.highBg : 'transparent';

  return (
    <div style={{
      flexShrink: 0, width: 280,
      padding: '10px 12px',
      background: rowBg,
      borderLeft: `4px solid ${cfg.color}`,
      borderRight: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <LevelBadge level={event.level} />
          <Typography.Text strong style={{ color: t.text, fontSize: 13 }}>
            {EVENT_TYPE_LABELS[event.type]}
          </Typography.Text>
          <Typography.Link style={{ marginLeft: 'auto', fontSize: 11 }} onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.id}`); }}>详情</Typography.Link>
          <span style={{ fontSize: 11, color: t.muted }}>{event.confidence}%</span>
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {event.roadName} {event.stakeNumber} {event.direction}
          <span style={{ float: 'right' }}>{timeStr}</span>
        </Typography.Text>
        <div style={{ color: t.muted, fontSize: 11, marginTop: 1 }}>
          {event.source === 'camera' ? '📷' : '✈️'} {event.sourceDetail}
          {event.status !== 'pending' && <StatusTag status={event.status} />}
        </div>
      </div>
      <Space size={4} style={{ marginTop: 4 }}>
        {event.status === 'pending' && (
          <Button size="small" type="primary" ghost icon={<CheckOutlined />} onClick={handleConfirm}>确认</Button>
        )}
        {isDispatchable && (
          <Button size="small" type="primary" danger ghost icon={<SendOutlined />} onClick={handleDispatch} loading={event.status === 'dispatching'}>
            {event.status === 'dispatching' ? '抵近中...' : '调度🚁'}
          </Button>
        )}
        {event.status === 'arrived' && (
          <Button size="small" type="primary" onClick={() => showVideoWindow(event.droneId!)}>查看画面</Button>
        )}
        {event.status !== 'closed' && (
          <Button size="small" icon={<CloseOutlined />} onClick={handleClose}>关闭</Button>
        )}
      </Space>
    </div>
  );
}

/** 紧凑模式：单行，高度 36px */
function CompactRow({ event }: { event: HighwayEvent }) {
  const navigate = useNavigate();
  const updateEvent = useEventStore((s) => s.updateEvent);
  const t = useThemeColors();
  const cfg = EVENT_LEVEL_CONFIG[event.level];
  const timeStr = new Date(event.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 12px', height: 36,
        borderBottom: `1px solid ${t.border}`,
        borderLeft: `3px solid ${cfg.color}`,
        background: event.level === 'high' ? t.highBg : 'transparent',
        fontSize: 12, color: t.text,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      <LevelBadge level={event.level} />
      <span style={{ fontWeight: 500, minWidth: 60 }}>{EVENT_TYPE_LABELS[event.type]}</span>
      <span style={{ color: t.muted }}>{event.roadName} {event.stakeNumber}</span>
      <span style={{ marginLeft: 'auto', color: t.muted }}>{timeStr}</span>
      {event.status !== 'pending' && <StatusTag status={event.status} />}
      {event.status === 'pending' && (
        <Button
          size="small" type="link" style={{ fontSize: 11, padding: 0, height: 22 }}
          onClick={(e) => { e.stopPropagation(); updateEvent(event.id, { status: 'confirmed', confirmedBy: '值班员' }); }}
        >
          确认
        </Button>
      )}
    </div>
  );
}

export function EventStream() {
  const events = useEventStore((s) => s.events);
  const filterLevel = useEventStore((s) => s.filterLevel);
  const setFilterLevel = useEventStore((s) => s.setFilterLevel);
  const { setAIDrawer, setHistoryDrawer } = useUIStore();
  const t = useThemeColors();
  const [compact, setCompact] = useState(false);

  const filtered = filterLevel === 'all' ? events : events.filter((e) => e.level === filterLevel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0,
      }}>
        <Typography.Text strong style={{ fontSize: 13, color: t.text }}>
          实时事件流
        </Typography.Text>
        <Space size={8}>
          <Switch
            size="small"
            checked={compact}
            onChange={setCompact}
            checkedChildren="紧凑"
            unCheckedChildren="详情"
          />
          <Segmented
            size="small"
            options={FILTER_OPTIONS}
            value={filterLevel}
            onChange={(v) => setFilterLevel(v as EventLevel | 'all')}
          />
          <Badge count={0} size="small">
            <Button type="text" size="small" icon={<MessageOutlined />} onClick={() => setAIDrawer(true)}>
              AI助手
            </Button>
          </Badge>
          <Button type="text" size="small" icon={<HistoryOutlined />} onClick={() => setHistoryDrawer(true)}>
            历史查询
          </Button>
        </Space>
      </div>
      <div style={{
        flex: 1, overflowX: compact ? 'hidden' : 'auto', overflowY: compact ? 'auto' : 'hidden',
        display: 'flex', flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'stretch' : 'stretch',
      }}>
        {filtered.map((evt) =>
          compact
            ? <CompactRow key={evt.id} event={evt} />
            : <EventRow key={evt.id} event={evt} />
        )}
      </div>
    </div>
  );
}
