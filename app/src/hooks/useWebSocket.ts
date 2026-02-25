import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatState, WebSocketMessage } from '@/types/chat';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

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
  
  const connect = useCallback(() => {
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
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
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
  
  const handleMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'connected':
        console.log('Connected with userId:', data.userId);
        break;
        
      case 'waiting':
        setChatState(prev => ({
          ...prev,
          status: 'searching',
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
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
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
              text: data.message,
              sender: 'system',
              timestamp: Date.now(),
            },
          ],
        }));
        break;
        
      case 'message':
        setChatState(prev => ({
          ...prev,
          isTyping: false,
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
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
              id: Date.now().toString(),
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
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
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
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
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
              id: Date.now().toString(),
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
              id: Date.now().toString(),
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
  }, []);
  
  const findMatch = useCallback((interests?: string[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'find_match',
        interests: interests || [],
      }));
      
      setChatState(prev => ({
        ...prev,
        status: 'searching',
        messages: [],
        partnerId: null,
        isTyping: false,
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
      wsRef.current.send(JSON.stringify({
        type: 'new_chat',
        interests: interests || [],
      }));
      
      setChatState(prev => ({
        ...prev,
        status: 'searching',
        messages: [],
        partnerId: null,
        isTyping: false,
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
