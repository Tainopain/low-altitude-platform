import { Space, Tag } from 'antd';
import { QUICK_QUESTIONS } from '../../types/chat';

interface Props { onSend: (text: string) => void; disabled: boolean; }

export function QuickTags({ onSend, disabled }: Props) {
  return (
    <Space wrap style={{ padding: '8px 0' }}>
      {QUICK_QUESTIONS.map((q) => (
        <Tag
          key={q.key}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer', padding: '4px 10px', fontSize: 12 }}
          color="blue"
          onClick={() => !disabled && onSend(q.text)}
        >
          {q.label}
        </Tag>
      ))}
    </Space>
  );
}
