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
    <div className="flex flex-col h-full overflow-hidden bg-void-800/30 md:bg-void-800/50 rounded-t-2xl md:rounded-2xl md:border md:border-void-700 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 no-scrollbar" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8 md:mt-10">
            <p className="text-base md:text-lg">The campfire is lit.</p>
            <p className="text-xs md:text-sm">Start by sharing your vision.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`p-1.5 md:p-2 rounded-full shrink-0 ${msg.role === 'user' ? 'bg-sky-900/40 text-sky-300' : 'bg-campfire-900/40 text-campfire-300'}`}>
              {msg.role === 'user' ? <User size={16} className="md:w-5 md:h-5" /> : <Bot size={16} className="md:w-5 md:h-5" />}
            </div>
            <div
              className={`max-w-[85%] md:max-w-[80%] rounded-xl md:rounded-2xl p-3 md:p-4 text-xs md:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-void-700/80 text-gray-100 rounded-tr-none'
                  : 'bg-gradient-to-br from-void-700/60 to-void-800/60 border border-void-700/50 text-gray-200 rounded-tl-none shadow-md'
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