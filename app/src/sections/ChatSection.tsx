import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, MessageCircle, Users, Smile } from 'lucide-react';
import { EmojiPicker } from '@/components/EmojiPicker';
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
  onSendReaction: (messageId: string, emoji: string) => void;
  onStopChat: () => void;
  onNewChat: () => void;
}

export function ChatSection({
  chatState,
  onSendMessage,
  onSendTyping,
  onSendReaction,
  onStopChat,
  onNewChat
}: ChatSectionProps) {
  const [inputText, setInputText] = useState('');
  const [newChatCooldown, setNewChatCooldown] = useState(0);
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle New Chat with 5s cooldown
  const handleNewChat = useCallback(() => {
    if (newChatCooldown > 0) return;
    onNewChat();
    setNewChatCooldown(5);
    cooldownRef.current = setInterval(() => {
      setNewChatCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [newChatCooldown, onNewChat]);

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
    <div className="w-full h-dvh bg-black flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="h-14 md:h-16 header-border bg-black flex items-center justify-between px-3 md:px-[5vw] shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-base md:text-lg text-text-primary">
            ShadowChat
          </span>
        </div>

        {/* Center Status */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`w-2 h-2 rounded-full ${chatState.status === 'matched' ? 'bg-neon-green animate-pulse' :
            chatState.status === 'searching' ? 'bg-yellow-500 animate-pulse' :
              chatState.status === 'disconnected' || chatState.status === 'error' ? 'bg-red-500' :
                'bg-text-secondary/50'
            }`} />
          <span className="font-mono text-[10px] md:text-xs text-text-secondary uppercase tracking-wider">
            {getStatusText()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {chatState.status === 'matched' && (
            <button
              onClick={onStopChat}
              className="flex items-center gap-1 md:gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="font-mono text-xs md:text-sm">Stop</span>
            </button>
          )}
          <button
            onClick={handleNewChat}
            disabled={newChatCooldown > 0}
            className={`flex items-center gap-1 md:gap-2 transition-colors ${newChatCooldown > 0
              ? 'text-text-secondary/40 cursor-not-allowed'
              : 'text-neon-cyan hover:text-neon-cyan/80'
              }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-mono text-xs md:text-sm">
              {newChatCooldown > 0 ? `New (${newChatCooldown}s)` : 'New'}
            </span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col px-2 md:px-[5vw] py-2 md:py-4 min-h-0 pb-safe">
        <div className="chat-area flex-1 rounded-lg overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
            {chatState.messages.length === 0 && chatState.status === 'idle' && (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary/50">
                <Users className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-30" />
                <p className="font-mono text-xs md:text-sm">Click "New" to start chatting</p>
              </div>
            )}

            {chatState.messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.sender === 'user'
                  ? 'items-end'
                  : message.sender === 'stranger'
                    ? 'items-start'
                    : 'items-center'
                  } animate-fade-in-up`}
              >
                {/* Label */}
                {message.sender !== 'system' && (
                  <span className="font-mono text-[10px] md:text-[11px] text-text-secondary/45 mb-1 px-2">
                    {message.sender === 'user' ? 'You' : 'Stranger'}
                  </span>
                )}

                {/* Bubble + Reaction Trigger */}
                <div className="relative">
                  <div className={`flex items-center gap-1.5 group ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Message Bubble */}
                    <div
                      className={`max-w-[75vw] md:max-w-[56vw] px-3 md:px-4 py-2 md:py-3 text-sm md:text-base leading-relaxed ${message.sender === 'user'
                        ? 'message-bubble-user'
                        : message.sender === 'stranger'
                          ? 'message-bubble-stranger'
                          : 'message-bubble-system text-center'
                        }`}
                    >
                      {message.text}
                    </div>

                    {/* Reaction Button - visible on mobile, hover on desktop */}
                    {message.sender !== 'system' && chatState.status === 'matched' && (
                      <button
                        onClick={() => setActiveReactionId(activeReactionId === message.id ? null : message.id)}
                        className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-all opacity-60 md:opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <Smile className="w-4 h-4 text-text-secondary" />
                      </button>
                    )}
                  </div>

                  {/* Emoji Picker */}
                  {activeReactionId === message.id && (
                    <div className={`absolute ${message.sender === 'user' ? 'right-0' : 'left-0'} z-50`}>
                      <EmojiPicker
                        onSelect={(emoji) => onSendReaction(message.id, emoji)}
                        onClose={() => setActiveReactionId(null)}
                      />
                    </div>
                  )}
                </div>

                {/* Reactions Display - one per user */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className={`flex gap-1 mt-1 px-1 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.reactions.map((r, i) => (
                      <span
                        key={`${r.emoji}-${r.from}-${i}`}
                        className="bg-dark-input border border-white/10 rounded-full px-1.5 py-0.5 text-sm"
                      >
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {chatState.isTyping && (
              <div className="flex flex-col items-start animate-fade-in-up">
                <span className="font-mono text-[10px] md:text-[11px] text-text-secondary/45 mb-1 px-2">
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
          <div className="p-2 md:p-4 border-t border-white/10">
            <div className="flex items-center gap-2 md:gap-3">
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
                      : "Click New to start"
                }
                disabled={chatState.status !== 'matched'}
                className="flex-1 bg-dark-input text-text-primary placeholder:text-text-secondary/40 px-3 md:px-4 py-2.5 md:py-3 rounded-md text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={chatState.status !== 'matched' || !inputText.trim()}
                className="w-10 h-10 md:w-12 md:h-12 bg-neon-cyan text-black rounded-md flex items-center justify-center btn-neon disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none shrink-0"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
