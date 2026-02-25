import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatState, WebSocketMessage } from '@/types/chat';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

// Unique ID generator to avoid duplicate keys
let messageIdCounter = 0;
function generateMessageId(): string {
  messageIdCounter += 1;
  return `${Date.now()}-${messageIdCounter}`;
}

export function useWebSocket(): {
  connected: boolean;
  chatState: ChatState;
  findMatch: (interests?: string[]) => void;
  cancelSearch: () => void;
  sendMessage: (text: string) => void;
  sendTyping: (isTyping: boolean) => void;
  stopChat: () => void;
  newChat: (interests?: string[]) => void;
} {
  const [connected, setConnected] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({
    status: 'idle',
    partnerId: null,
    messages: [],
    isTyping: false,
    errorMessage: '',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMessageRef = useRef<(data: WebSocketMessage) => void>(() => { });

  const connect = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect loop
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleMessageRef.current(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);

        // If we were in a chat or searching, reset the state
        // because the server has lost our pairing
        setChatState(prev => {
          if (prev.status === 'matched' || prev.status === 'searching') {
            return {
              ...prev,
              status: 'disconnected',
              partnerId: null,
              isTyping: false,
              messages: [
                ...prev.messages,
                {
                  id: generateMessageId(),
                  text: 'Connection lost. Click "New" to reconnect and find a new chat.',
                  sender: 'system',
                  timestamp: Date.now(),
                },
              ],
            };
          }
          return prev;
        });

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, []);

  const handleMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case 'connected':
        console.log('Connected with userId:', data.userId);
        // If we reconnected, ensure we're in a clean state
        // (server gave us a new userId, old pairing is gone)
        setChatState(prev => {
          if (prev.status === 'matched' || prev.status === 'searching') {
            return {
              ...prev,
              status: 'disconnected',
              partnerId: null,
              isTyping: false,
              messages: [
                ...prev.messages,
                {
                  id: generateMessageId(),
                  text: 'Reconnected to server. Click "New" to start a new chat.',
                  sender: 'system',
                  timestamp: Date.now(),
                },
              ],
            };
          }
          return prev;
        });
        break;

      case 'waiting':
        setChatState(prev => ({
          ...prev,
          status: 'searching',
          messages: [
            ...prev.messages,
            {
              id: generateMessageId(),
              text: data.message,
              sender: 'system',
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case 'matched':
        setChatState(prev => ({
          ...prev,
          status: 'matched',
          partnerId: data.partnerId,
          isTyping: false,
          messages: [
            ...prev.messages,
            {
              id: generateMessageId(),
              text: data.message,
              sender: 'system',
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case 'message':
        // If we receive a message, we're definitely in an active chat
        // Restore 'matched' status if it was accidentally changed
        setChatState(prev => ({
          ...prev,
          status: 'matched',
          isTyping: false,
          messages: [
            ...prev.messages,
            {
              id: generateMessageId(),
              text: data.text,
              sender: 'stranger',
              timestamp: data.timestamp,
            },
          ],
        }));
        break;

      case 'message_sent':
        setChatState(prev => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: generateMessageId(),
              text: data.text,
              sender: 'user',
              timestamp: data.timestamp,
            },
          ],
        }));
        break;

      case 'partner_disconnected':
        setChatState(prev => ({
          ...prev,
          status: 'disconnected',
          partnerId: null,
          isTyping: false,
          messages: [
            ...prev.messages,
            {
              id: generateMessageId(),
              text: data.message,
              sender: 'system',
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case 'chat_ended':
        setChatState(prev => ({
          ...prev,
          status: 'idle',
          partnerId: null,
          isTyping: false,
          messages: [
            ...prev.messages,
            {
              id: generateMessageId(),
              text: data.message,
              sender: 'system',
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case 'search_cancelled':
        setChatState(prev => ({
          ...prev,
          status: 'idle',
          messages: [
            ...prev.messages,
            {
              id: generateMessageId(),
              text: 'Search cancelled.',
              sender: 'system',
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case 'search_timeout':
        setChatState(prev => ({
          ...prev,
          status: 'idle',
          messages: [
            ...prev.messages,
            {
              id: generateMessageId(),
              text: data.message,
              sender: 'system',
              timestamp: Date.now(),
            },
          ],
        }));
        break;

      case 'typing':
        setChatState(prev => ({
          ...prev,
          isTyping: data.isTyping,
        }));
        break;

      case 'error':
        setChatState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: data.message,
        }));
        break;

      default:
        console.log('Unknown message type:', data);
    }
  };

  // Keep ref in sync so WebSocket closure always uses latest handler
  handleMessageRef.current = handleMessage;

  const findMatch = useCallback((interests?: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Clear messages and set searching state
      setChatState({
        status: 'searching',
        partnerId: null,
        messages: [],
        isTyping: false,
        errorMessage: '',
      });

      wsRef.current.send(JSON.stringify({
        type: 'find_match',
        interests: interests || [],
      }));
    }
  }, []);

  const cancelSearch = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cancel_search' }));
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && text.trim()) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        text: text.trim(),
      }));
    }
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping,
      }));
    }
  }, []);

  const stopChat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_chat' }));
    }
  }, []);

  const newChat = useCallback((interests?: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Clear messages and set searching state
      setChatState({
        status: 'searching',
        partnerId: null,
        messages: [],
        isTyping: false,
        errorMessage: '',
      });

      wsRef.current.send(JSON.stringify({
        type: 'new_chat',
        interests: interests || [],
      }));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected,
    chatState,
    findMatch,
    cancelSearch,
    sendMessage,
    sendTyping,
    stopChat,
    newChat,
  };
}
