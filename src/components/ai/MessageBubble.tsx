import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types/chat';

interface Props { message: ChatMessage; }

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{
        maxWidth: '85%',
        padding: '8px 14px',
        borderRadius: 12,
        background: isUser ? '#58A6FF' : '#21262D',
        color: isUser ? '#fff' : '#E6EDF3',
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
