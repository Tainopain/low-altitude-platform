import { Space, Input, Select, DatePicker, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import type { EventType, EventLevel } from '../../types/event';

const { RangePicker } = DatePicker;

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  types: EventType[];
  onTypesChange: (v: EventType[]) => void;
  levels: EventLevel[];
  onLevelsChange: (v: EventLevel[]) => void;
  onExport: () => void;
}

export function FilterBar({ search, onSearchChange, types, onTypesChange, levels, onLevelsChange, onExport }: FilterBarProps) {
  return (
    <Space wrap style={{ padding: '12px 0' }}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索路段桩号..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ width: 200 }}
        allowClear
      />
      <Select
        mode="multiple"
        placeholder="事件类型"
        value={types}
        onChange={onTypesChange}
        style={{ minWidth: 140 }}
        options={[
          { label: '交通事故', value: 'accident' },
          { label: '拥堵事件', value: 'congestion' },
          { label: '障碍物', value: 'obstacle' },
          { label: '烟雾异常', value: 'smoke' },
          { label: '火焰检测', value: 'fire' },
        ]}
        maxTagCount={2}
      />
      <Select
        mode="multiple"
        placeholder="等级"
        value={levels}
        onChange={onLevelsChange}
        style={{ minWidth: 100 }}
        options={[
          { label: '高危', value: 'high' },
          { label: '中危', value: 'medium' },
          { label: '低危', value: 'low' },
        ]}
        maxTagCount={1}
      />
      <RangePicker />
      <Button icon={<DownloadOutlined />} onClick={onExport}>导出CSV</Button>
    </Space>
  );
}
