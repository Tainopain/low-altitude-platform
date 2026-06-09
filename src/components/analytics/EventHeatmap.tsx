import { useMemo } from 'react';
import { Card, Typography, Progress, Table, Tag } from 'antd';
import { useEventStore } from '../../stores/eventStore';
import { useThemeColors } from '../../theme';
import { EVENT_TYPE_LABELS } from '../../types/event';

const PIE_COLORS = ['#F85149', '#D29922', '#79C0FF', '#58A6FF', '#3FB950'];

/** 9 个监控点坐标（用于按区域分组） */
const MONITOR_POINTS = [
  { name: '北环立交',   lng: 106.497385, lat: 29.609658 },
  { name: '石马河立交', lng: 106.471885, lat: 29.584855 },
  { name: '东环立交',   lng: 106.551681, lat: 29.620295 },
  { name: '四公里立交', lng: 106.575596, lat: 29.514190 },
  { name: '江南立交',   lng: 106.592240, lat: 29.530410 },
  { name: '凤中立交',   lng: 106.447897, lat: 29.498872 },
  { name: '西环立交',   lng: 106.441436, lat: 29.517380 },
  { name: '高滩岩立交', lng: 106.443702, lat: 29.539939 },
  { name: '杨公桥立交', lng: 106.453861, lat: 29.564296 },
];

function nearestPoint(lng: number, lat: number): string {
  let best = MONITOR_POINTS[0].name;
  let min = Infinity;
  for (const pt of MONITOR_POINTS) {
    const d = Math.hypot(lng - pt.lng, lat - pt.lat);
    if (d < min) { min = d; best = pt.name; }
  }
  return best;
}

export function EventHeatmap() {
  const events = useEventStore((s) => s.events);
  const t = useThemeColors();

  // 按监测点分组统计
  const locStats = useMemo(() => {
    const map = new Map<string, { total: number; high: number; medium: number; low: number; pending: number }>();
    MONITOR_POINTS.forEach((pt) => map.set(pt.name, { total: 0, high: 0, medium: 0, low: 0, pending: 0 }));
    events.forEach((e) => {
      const name = e.roadName || nearestPoint(e.coordinates[0], e.coordinates[1]);
      const s = map.get(name);
      if (!s) return;
      s.total++;
      if (e.level === 'high') s.high++;
      else if (e.level === 'medium') s.medium++;
      else s.low++;
      if (e.status === 'pending') s.pending++;
    });
    return Array.from(map.entries())
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.total - a.total);
  }, [events]);

  const maxTotal = Math.max(1, ...locStats.map((l) => l.total));

  // 类型分布
  const typeDist = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      const label = EVENT_TYPE_LABELS[e.type as keyof typeof EVENT_TYPE_LABELS] || e.type;
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [events]);

  return (
    <Card size="small" title="🔥 事件热力分布（按监测点统计）" style={{ height: '100%' }}>
      {/* 热力柱状图 */}
      <div style={{ marginBottom: 16 }}>
        {locStats.map((loc) => (
          <div key={loc.name} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <Typography.Text style={{ width: 80, fontSize: 12, color: t.text, textAlign: 'right', flexShrink: 0 }}>
              {loc.name}
            </Typography.Text>
            <div style={{ flex: 1 }}>
              <Progress
                percent={Math.round((loc.total / maxTotal) * 100)}
                size="small"
                showInfo={false}
                strokeColor={loc.high > 0 ? '#F85149' : loc.medium > 0 ? '#D29922' : '#58A6FF'}
                trailColor={t.border}
              />
            </div>
            <Typography.Text style={{ width: 60, fontSize: 11, color: t.muted, flexShrink: 0 }}>
              {loc.total} 起
            </Typography.Text>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {loc.high > 0 && <Tag color="red" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>{loc.high}</Tag>}
              {loc.pending > 0 && <Tag color="orange" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>待{loc.pending}</Tag>}
            </div>
          </div>
        ))}
      </div>

      {/* 类型分布 */}
      <Typography.Text strong style={{ color: t.text, marginBottom: 8, display: 'block' }}>
        📋 事件类型
      </Typography.Text>
      <Table
        dataSource={typeDist.map((d, i) => ({ key: i, type: d[0], count: d[1] }))}
        columns={[
          { title: '类型', dataIndex: 'type', width: 80 },
          {
            title: '占比', dataIndex: 'count', width: 120,
            render: (v: number) => (
              <Progress percent={Math.round((v / events.length) * 100)} size="small"
                strokeColor={PIE_COLORS[typeDist.findIndex((d) => d[1] === v) % 5]}
              />
            ),
          },
          { title: '数量', dataIndex: 'count', width: 50, render: (v: number) => <Tag>{v}</Tag> },
        ]}
        size="small"
        pagination={false}
        showHeader={false}
      />
    </Card>
  );
}
