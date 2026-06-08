import { useState, useMemo } from 'react';
import { Table, Progress } from 'antd';
import type { HighwayEvent, EventType, EventLevel, EventStatus } from '../../types/event';
import { EVENT_TYPE_LABELS } from '../../types/event';
import { LevelBadge } from '../shared/LevelBadge';
import { StatusTag } from '../shared/StatusTag';
import { DetailModal } from './DetailModal';

interface Props {
  events: HighwayEvent[];
  search: string;
  types: EventType[];
  levels: EventLevel[];
}

export function EventTable({ events, search, types, levels }: Props) {
  const [detailEvent, setDetailEvent] = useState<HighwayEvent | null>(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (search && !`${e.roadName} ${e.stakeNumber}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (types.length > 0 && !types.includes(e.type)) return false;
      if (levels.length > 0 && !levels.includes(e.level)) return false;
      return true;
    });
  }, [events, search, types, levels]);

  const columns = [
    {
      title: '时间', dataIndex: 'createdAt', width: 90,
      render: (v: number) => new Date(v).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
    {
      title: '类型', dataIndex: 'type', width: 85,
      render: (v: EventType) => EVENT_TYPE_LABELS[v],
    },
    {
      title: '路段', width: 150,
      render: (_: unknown, r: HighwayEvent) => `${r.roadName} ${r.stakeNumber} ${r.direction}`,
    },
    {
      title: '等级', dataIndex: 'level', width: 70,
      render: (v: EventLevel) => <LevelBadge level={v} />,
    },
    {
      title: 'AI%', dataIndex: 'confidence', width: 80,
      render: (v: number) => <Progress percent={v} size="small" strokeColor={v > 80 ? '#F85149' : '#D29922'} format={() => `${v}%`} />,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: EventStatus) => <StatusTag status={v} />,
    },
    {
      title: '确认人', dataIndex: 'confirmedBy', width: 80,
      render: (v: string | undefined) => v || '—',
    },
    {
      title: '操作', width: 70,
      render: (_: unknown, r: HighwayEvent) => <a onClick={() => setDetailEvent(r)}>详情</a>,
    },
  ];

  return (
    <>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ defaultPageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 800 }}
      />
      <DetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
    </>
  );
}
