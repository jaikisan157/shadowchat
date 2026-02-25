import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// Create HTTP server
const server = createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', connections: wss.clients.size }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Matchmaking queue and active pairs
const waitingUsers = new Map(); // userId -> { ws, interests }
const activePairs = new Map(); // userId -> partnerId
const userSockets = new Map(); // userId -> ws
const lastActivity = new Map(); // userId -> timestamp

const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes

// Generate unique user ID
function generateUserId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Find a match for a user
function findMatch(userId, interests = []) {
  for (const [waitingId, waitingUser] of waitingUsers) {
    if (waitingId !== userId) {
      // Check for common interests if both have interests
      if (interests.length > 0 && waitingUser.interests.length > 0) {
        const commonInterests = interests.filter(i => waitingUser.interests.includes(i));
        if (commonInterests.length === 0) continue;
      }
      return waitingId;
    }
  }
  return null;
}

// Pair two users
function pairUsers(user1Id, user2Id) {
  // Remove both from waiting queue first
  waitingUsers.delete(user1Id);
  waitingUsers.delete(user2Id);

  activePairs.set(user1Id, user2Id);
  activePairs.set(user2Id, user1Id);

  const user1Ws = userSockets.get(user1Id);
  const user2Ws = userSockets.get(user2Id);

  if (user1Ws && user1Ws.readyState === 1) { // WebSocket.OPEN = 1
    user1Ws.send(JSON.stringify({
      type: 'matched',
      partnerId: user2Id,
      message: "You're chatting with a random stranger. Say hi!"
    }));
  }

  if (user2Ws && user2Ws.readyState === 1) {
    user2Ws.send(JSON.stringify({
      type: 'matched',
      partnerId: user1Id,
      message: "You're chatting with a random stranger. Say hi!"
    }));
  }
}

// Disconnect a user and clean up
function disconnectUser(userId) {
  const partnerId = activePairs.get(userId);

  if (partnerId) {
    const partnerWs = userSockets.get(partnerId);
    if (partnerWs && partnerWs.readyState === 1) {
      partnerWs.send(JSON.stringify({
        type: 'partner_disconnected',
        message: 'Stranger has disconnected.'
      }));
    }
    activePairs.delete(partnerId);
    activePairs.delete(userId);
  }

  waitingUsers.delete(userId);
  userSockets.delete(userId);
  lastActivity.delete(userId);
}

// Broadcast online count to all connected clients
function broadcastOnlineCount() {
  const count = wss.clients.size;
  const message = JSON.stringify({ type: 'online_count', count });
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const userId = generateUserId();
  userSockets.set(userId, ws);

  console.log(`User connected: ${userId}, Total connections: ${wss.clients.size}`);

  // Send user their ID and current online count
  ws.send(JSON.stringify({
    type: 'connected',
    userId: userId,
    onlineCount: wss.clients.size
  }));

  // Track activity
  lastActivity.set(userId, Date.now());

  // Notify everyone about updated count
  broadcastOnlineCount();

  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Update activity on any message
      lastActivity.set(userId, Date.now());

      switch (message.type) {
        case 'find_match':
          // Remove from waiting if already there
          waitingUsers.delete(userId);

          // Try to find a match
          const matchId = findMatch(userId, message.interests || []);

          if (matchId) {
            // Found a match
            waitingUsers.delete(matchId);
            pairUsers(userId, matchId);
          } else {
            // Add to waiting queue
            waitingUsers.set(userId, {
              ws: ws,
              interests: message.interests || [],
              timestamp: Date.now()
            });

            ws.send(JSON.stringify({
              type: 'waiting',
              message: 'Looking for someone to chat with...'
            }));
          }
          break;

        case 'cancel_search':
          waitingUsers.delete(userId);
          ws.send(JSON.stringify({
            type: 'search_cancelled'
          }));
          break;

        case 'message':
          const partnerId = activePairs.get(userId);
          if (partnerId) {
            const partnerWs = userSockets.get(partnerId);
            if (partnerWs && partnerWs.readyState === 1) {
              partnerWs.send(JSON.stringify({
                type: 'message',
                from: 'stranger',
                text: message.text,
                timestamp: Date.now()
              }));
            }

            // Confirm to sender
            ws.send(JSON.stringify({
              type: 'message_sent',
              text: message.text,
              timestamp: Date.now()
            }));
          }
          break;

        case 'typing':
          const typingPartnerId = activePairs.get(userId);
          if (typingPartnerId) {
            const partnerWs = userSockets.get(typingPartnerId);
            if (partnerWs && partnerWs.readyState === 1) {
              partnerWs.send(JSON.stringify({
                type: 'typing',
                isTyping: message.isTyping
              }));
            }
          }
          break;

        case 'stop_chat':
          disconnectUser(userId);
          ws.send(JSON.stringify({
            type: 'chat_ended',
            message: 'You ended the chat.'
          }));
          break;

        case 'new_chat':
          // Disconnect from current chat if any
          disconnectUser(userId);

          // Start looking for new match
          waitingUsers.set(userId, {
            ws: ws,
            interests: message.interests || [],
            timestamp: Date.now()
          });

          ws.send(JSON.stringify({
            type: 'waiting',
            message: 'Looking for someone to chat with...'
          }));

          // Try immediate match
          const newMatchId = findMatch(userId, message.interests || []);
          if (newMatchId) {
            waitingUsers.delete(newMatchId);
            pairUsers(userId, newMatchId);
          }
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    console.log(`User disconnected: ${userId}`);
    // Notify everyone about updated count (after a short delay so wss.clients is updated)
    setTimeout(() => broadcastOnlineCount(), 100);
    disconnectUser(userId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    disconnectUser(userId);
  });

  // Heartbeat: ping every 15 seconds, terminate if no pong received
  let isAlive = true;

  ws.on('pong', () => {
    isAlive = true;
  });

  const pingInterval = setInterval(() => {
    if (ws.readyState !== 1) {
      clearInterval(pingInterval);
      return;
    }

    if (!isAlive) {
      // Connection is dead - no pong received since last ping
      console.log(`Heartbeat failed for user ${userId}, terminating`);
      clearInterval(pingInterval);
      ws.terminate(); // force close, triggers 'close' event
      return;
    }

    isAlive = false;
    ws.ping();
  }, 15000);

  ws.on('close', () => {
    clearInterval(pingInterval);
  });
});

// Clean up old waiting users every minute
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  for (const [userId, userData] of waitingUsers) {
    if (now - userData.timestamp > timeout) {
      const ws = userSockets.get(userId);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'search_timeout',
          message: 'Search timed out. No one is available right now.'
        }));
      }
      waitingUsers.delete(userId);
    }
  }
}, 60000);

export { server, wss };

// Clean up idle users every 30 seconds
setInterval(() => {
  const now = Date.now();

  for (const [userId, timestamp] of lastActivity) {
    if (now - timestamp > IDLE_TIMEOUT) {
      const ws = userSockets.get(userId);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Disconnected due to inactivity.'
        }));
        ws.close();
      }
      console.log(`User ${userId} disconnected due to inactivity`);
      disconnectUser(userId);
    }
  }
}, 30000);
