import { useState, useMemo } from 'react';
import { Drawer, message } from 'antd';
import { useUIStore } from '../../stores/uiStore';
import { useEventStore } from '../../stores/eventStore';
import { FilterBar } from './FilterBar';
import { EventTable } from './EventTable';
import { EVENT_TYPE_LABELS } from '../../types/event';
import type { EventType, EventLevel } from '../../types/event';

export function HistoryDrawer() {
  const { historyDrawerOpen, setHistoryDrawer } = useUIStore();
  const events = useEventStore((s) => s.events);
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState<EventType[]>([]);
  const [levels, setLevels] = useState<EventLevel[]>([]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (search && !`${e.roadName} ${e.stakeNumber}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (types.length > 0 && !types.includes(e.type)) return false;
      if (levels.length > 0 && !levels.includes(e.level)) return false;
      return true;
    });
  }, [events, search, types, levels]);

  const handleExport = () => {
    const headers = ['时间', '类型', '路段', '方向', '等级', '置信度', '检测源', '状态', '确认人'];
    const rows = filteredEvents.map((e) => [
      new Date(e.createdAt).toLocaleString('zh-CN'),
      EVENT_TYPE_LABELS[e.type],
      `${e.roadName} ${e.stakeNumber}`,
      e.direction,
      e.level === 'high' ? '高危' : e.level === 'medium' ? '中危' : '低危',
      `${e.confidence}%`,
      e.sourceDetail,
      e.status,
      e.confirmedBy || '',
    ]);

    const BOM = '﻿';
    const csv = BOM + [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `低空平台-事件导出-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${filteredEvents.length} 条事件`);
  };

  return (
    <Drawer
      title="📋 历史查询"
      open={historyDrawerOpen}
      onClose={() => setHistoryDrawer(false)}
      size="large"
      styles={{ body: { padding: '0 24px' } }}
    >
      <FilterBar
        search={search} onSearchChange={setSearch}
        types={types} onTypesChange={setTypes}
        levels={levels} onLevelsChange={setLevels}
        onExport={handleExport}
      />
      <EventTable events={events} search={search} types={types} levels={levels} />
    </Drawer>
  );
}
