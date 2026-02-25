import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, MessageCircle, Users } from 'lucide-react';
import type { Message } from '@/types/chat';

interface ChatSectionProps {
  chatState: {
    status: 'idle' | 'searching' | 'matched' | 'disconnected' | 'error';
    partnerId: string | null;
    messages: Message[];
    isTyping: boolean;
    errorMessage: string;
  };
  onSendMessage: (text: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  onStopChat: () => void;
  onNewChat: () => void;
}

export function ChatSection({ 
  chatState, 
  onSendMessage, 
  onSendTyping, 
  onStopChat, 
  onNewChat 
}: ChatSectionProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages, chatState.isTyping]);
  
  // Focus input when matched
  useEffect(() => {
    if (chatState.status === 'matched') {
      inputRef.current?.focus();
    }
  }, [chatState.status]);
  
  const handleSend = useCallback(() => {
    if (inputText.trim() && chatState.status === 'matched') {
      onSendMessage(inputText);
      setInputText('');
      onSendTyping(false);
    }
  }, [inputText, chatState.status, onSendMessage, onSendTyping]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
    
    // Send typing indicator
    if (value.length > 0) {
      onSendTyping(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onSendTyping(false);
      }, 1000);
    } else {
      onSendTyping(false);
    }
  }, [onSendTyping]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  
  const getStatusText = () => {
    switch (chatState.status) {
      case 'searching':
        return 'Finding someone...';
      case 'matched':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };
  
  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="h-16 header-border bg-black flex items-center justify-between px-[5vw] shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-lg text-text-primary">
            ShadowChat
          </span>
        </div>
        
        {/* Center Status */}
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full recording-dot ${
            chatState.status === 'matched' ? 'bg-red-500' : 
            chatState.status === 'searching' ? 'bg-yellow-500 animate-pulse' : 
            'bg-neon-green'
          }`} />
          <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">
            {getStatusText()}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          {chatState.status === 'matched' && (
            <button
              onClick={onStopChat}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="font-mono text-sm">Stop</span>
            </button>
          )}
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-mono text-sm">New Chat</span>
          </button>
        </div>
      </header>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col px-[5vw] py-4 min-h-0">
        <div className="chat-area flex-1 rounded-lg overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {chatState.messages.length === 0 && chatState.status === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary/50">
                <Users className="w-16 h-16 mb-4 opacity-30" />
                <p className="font-mono text-sm">Click "New Chat" to start</p>
              </div>
            )}
            
            {chatState.messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.sender === 'user' 
                    ? 'items-end' 
                    : message.sender === 'stranger'
                    ? 'items-start'
                    : 'items-center'
                } animate-fade-in-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Label */}
                {message.sender !== 'system' && (
                  <span className="font-mono text-[11px] text-text-secondary/45 mb-1 px-2">
                    {message.sender === 'user' ? 'You' : 'Stranger'}
                  </span>
                )}
                
                {/* Bubble */}
                <div
                  className={`max-w-[78vw] md:max-w-[56vw] px-4 py-3 text-sm md:text-base leading-relaxed ${
                    message.sender === 'user'
                      ? 'message-bubble-user'
                      : message.sender === 'stranger'
                      ? 'message-bubble-stranger'
                      : 'message-bubble-system text-center'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {chatState.isTyping && (
              <div className="flex flex-col items-start animate-fade-in-up">
                <span className="font-mono text-[11px] text-text-secondary/45 mb-1 px-2">
                  Stranger
                </span>
                <div className="message-bubble-stranger px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neon-cyan typing-dot" />
                  <span className="w-2 h-2 rounded-full bg-neon-cyan typing-dot" />
                  <span className="w-2 h-2 rounded-full bg-neon-cyan typing-dot" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  chatState.status === 'matched' 
                    ? "Type a message..." 
                    : chatState.status === 'searching'
                    ? "Finding a match..."
                    : "Click New Chat to start"
                }
                disabled={chatState.status !== 'matched'}
                className="flex-1 bg-dark-input text-text-primary placeholder:text-text-secondary/40 px-4 py-3 rounded-md text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={chatState.status !== 'matched' || !inputText.trim()}
                className="w-12 h-12 bg-neon-cyan text-black rounded-md flex items-center justify-center btn-neon disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
