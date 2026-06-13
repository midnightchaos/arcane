import { Message } from '@/types';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  loading?: boolean;
  streaming?: boolean;
}

export default function ChatWindow({ messages, streaming }: ChatWindowProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-3xl rounded-lg p-4 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-100'
            }`}
          >
            {message.agentType && (
              <div className="text-xs text-gray-400 mb-2 font-mono">
                {message.agentType}
              </div>
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
            <div className="text-xs opacity-50 mt-2">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
      
      {streaming && (
        <div className="flex justify-start">
          <div className="bg-gray-800 rounded-lg p-4">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
