import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types/chat';
import { useThemeColors } from '../../theme';

interface Props { message: ChatMessage; }

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const t = useThemeColors();

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{
        maxWidth: '85%',
        padding: '8px 14px',
        borderRadius: 12,
        background: isUser ? t.link : t.border,
        color: isUser ? '#fff' : t.text,
        borderBottomRightRadius: isUser ? 4 : 12,
        borderBottomLeftRadius: isUser ? 12 : 4,
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}
