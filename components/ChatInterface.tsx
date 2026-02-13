import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-void-800/50 rounded-2xl border border-void-700 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p className="text-lg">The campfire is lit.</p>
            <p className="text-sm">Start by sharing your vision.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`p-2 rounded-full shrink-0 ${msg.role === 'user' ? 'bg-sky-900/50 text-sky-200' : 'bg-campfire-900/50 text-campfire-200'}`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-void-700 text-gray-100 rounded-tr-none'
                  : 'bg-gradient-to-br from-void-700 to-void-800 border border-void-700 text-gray-200 rounded-tl-none shadow-lg'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
