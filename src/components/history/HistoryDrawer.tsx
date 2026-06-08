import { useState } from 'react';
import { Drawer, message } from 'antd';
import { useUIStore } from '../../stores/uiStore';
import { useEventStore } from '../../stores/eventStore';
import { FilterBar } from './FilterBar';
import { EventTable } from './EventTable';
import type { EventType, EventLevel } from '../../types/event';

export function HistoryDrawer() {
  const { historyDrawerOpen, setHistoryDrawer } = useUIStore();
  const events = useEventStore((s) => s.events);
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState<EventType[]>([]);
  const [levels, setLevels] = useState<EventLevel[]>([]);

  const handleExport = () => {
    message.success('CSV 导出成功（Demo）');
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
