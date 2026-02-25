export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'stranger' | 'system';
  timestamp: number;
}

export interface ChatState {
  status: 'idle' | 'searching' | 'matched' | 'disconnected' | 'error';
  partnerId: string | null;
  messages: Message[];
  isTyping: boolean;
  errorMessage: string;
  onlineCount: number;
}

export type WebSocketMessage =
  | { type: 'connected'; userId: string; onlineCount: number }
  | { type: 'waiting'; message: string }
  | { type: 'matched'; partnerId: string; message: string }
  | { type: 'message'; from: 'stranger'; text: string; timestamp: number }
  | { type: 'message_sent'; text: string; timestamp: number }
  | { type: 'partner_disconnected'; message: string }
  | { type: 'chat_ended'; message: string }
  | { type: 'search_cancelled' }
  | { type: 'search_timeout'; message: string }
  | { type: 'typing'; isTyping: boolean }
  | { type: 'online_count'; count: number }
  | { type: 'error'; message: string };

export interface UseWebSocketReturn {
  connected: boolean;
  chatState: ChatState;
  findMatch: (interests?: string[]) => void;
  cancelSearch: () => void;
  sendMessage: (text: string) => void;
  sendTyping: (isTyping: boolean) => void;
  stopChat: () => void;
  newChat: (interests?: string[]) => void;
}
