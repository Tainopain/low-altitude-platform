import { useRef, useEffect, useState } from 'react';
import { Drawer, Input, Button, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { MessageBubble } from './MessageBubble';
import { QuickTags } from './QuickTags';

export function AIDrawer() {
  const { aiDrawerOpen, setAIDrawer } = useUIStore();
  const { messages, send, streaming } = useChatStore();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text: string) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput('');
    await send(msg);
  };

  return (
    <Drawer
      title="🤖 AI助手 · DeepSeek V3"
      open={aiDrawerOpen}
      onClose={() => setAIDrawer(false)}
      width={480}
      styles={{ body: { padding: '0 16px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 55px)' } }}
    >
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {messages.length <= 1 && (
          <QuickTags onSend={handleSend} disabled={streaming} />
        )}
      </div>
      <div style={{ padding: '12px 0', borderTop: '1px solid #30363D' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => handleSend(input)}
            placeholder="输入问题..."
            disabled={streaming}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={() => handleSend(input)} loading={streaming} />
        </Space.Compact>
      </div>
    </Drawer>
  );
}
