import { Tag } from 'antd';
import type { EventLevel } from '../../types/event';
import { EVENT_LEVEL_CONFIG } from '../../types/event';

interface Props { level: EventLevel; }

export function LevelBadge({ level }: Props) {
  const cfg = EVENT_LEVEL_CONFIG[level];
  return (
    <Tag color={cfg.color} style={{ background: cfg.bgColor, border: `1px solid ${cfg.color}20` }}>
      {cfg.label}
    </Tag>
  );
}
