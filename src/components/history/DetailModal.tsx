import { Modal, Descriptions, Timeline, Image } from 'antd';
import type { HighwayEvent } from '../../types/event';
import { EVENT_TYPE_LABELS } from '../../types/event';
import { LevelBadge } from '../shared/LevelBadge';

interface Props { event: HighwayEvent | null; onClose: () => void; }

export function DetailModal({ event, onClose }: Props) {
  if (!event) return null;

  const timelineItems = [
    { children: `AI 检测: ${EVENT_TYPE_LABELS[event.type]} 置信度 ${event.confidence}%` },
    { children: `自动分级: ${event.level === 'high' ? '高危' : event.level === 'medium' ? '中危' : '低危'}` },
    { children: event.status !== 'pending' ? `人工确认: ${event.confirmedBy || '值班员'}` : '待确认...' },
    ...(event.droneId ? [{ children: `调度无人机: ${event.droneId}` }] : []),
    ...(event.status === 'arrived' || event.status === 'resolved' ? [{ children: '无人机抵近，画面确认' }] : []),
    ...(event.status === 'resolved' || event.status === 'closed' ? [{ children: '事件关闭归档' }] : []),
  ];

  return (
    <Modal title="事件详情" open={!!event} onCancel={onClose} footer={null} width={600}>
      {event.screenshot && (
        <Image src={event.screenshot} alt="事件截图" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} fallback="data:image/svg+xml,..." />
      )}
      <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="类型">{EVENT_TYPE_LABELS[event.type]}</Descriptions.Item>
        <Descriptions.Item label="等级"><LevelBadge level={event.level} /></Descriptions.Item>
        <Descriptions.Item label="路段">{event.roadName} {event.stakeNumber}</Descriptions.Item>
        <Descriptions.Item label="置信度">{event.confidence}%</Descriptions.Item>
        <Descriptions.Item label="检测源">{event.source === 'camera' ? '📷 摄像头' : '✈️ 无人机'}</Descriptions.Item>
        <Descriptions.Item label="时间">{new Date(event.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
      </Descriptions>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>处置时间轴</div>
      <Timeline items={timelineItems} />
    </Modal>
  );
}
