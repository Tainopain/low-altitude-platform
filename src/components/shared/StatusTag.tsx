import { Tag } from 'antd';
import type { EventStatus } from '../../types/event';

const STATUS_MAP: Record<EventStatus, { color: string; label: string }> = {
  pending:      { color: 'orange', label: '待确认' },
  confirmed:    { color: 'blue', label: '已确认' },
  dispatching:  { color: 'processing', label: '无人机抵近中' },
  arrived:      { color: 'cyan', label: '已抵近' },
  processing:   { color: 'processing', label: '处理中' },
  resolved:     { color: 'green', label: '已处理' },
  closed:       { color: 'default', label: '已关闭' },
};

interface Props { status: EventStatus; }

export function StatusTag({ status }: Props) {
  const cfg = STATUS_MAP[status];
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}
