import { useRef, useMemo } from 'react';
import { Segmented } from 'antd';
import { List } from 'react-window';
import { useEventStore } from '../../stores/eventStore';
import { EventCard } from './EventCard';
import type { HighwayEvent, EventLevel } from '../../types/event';

type RowProps = { filtered: HighwayEvent[] };

const FILTER_OPTIONS: { label: string; value: EventLevel | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '高危', value: 'high' },
  { label: '中危', value: 'medium' },
  { label: '低危', value: 'low' },
];

const CARD_HEIGHT = 130;

function EventRow({ index, style, filtered }: { index: number; style: React.CSSProperties; filtered: HighwayEvent[] }) {
  return <EventCard event={filtered[index]} style={style} />;
}

export function EventList() {
  const events = useEventStore((s) => s.events);
  const filterLevel = useEventStore((s) => s.filterLevel);
  const setFilterLevel = useEventStore((s) => s.setFilterLevel);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = filterLevel === 'all' ? events : events.filter((e) => e.level === filterLevel);
  const height = containerRef.current?.clientHeight ?? 400;

  const rowProps: RowProps = useMemo(() => ({ filtered }), [filtered]);

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '8px 12px' }}>
        <Segmented
          block
          size="small"
          options={FILTER_OPTIONS}
          value={filterLevel}
          onChange={(v) => setFilterLevel(v as EventLevel | 'all')}
        />
      </div>
      <List<RowProps>
        rowCount={filtered.length}
        rowHeight={CARD_HEIGHT}
        rowComponent={EventRow}
        rowProps={rowProps}
        style={{ height: height - 40, overflowX: 'hidden' }}
      />
    </div>
  );
}
