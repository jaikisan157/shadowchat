import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BotService } from './botService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env') });

// Initialize bot service
let botService = null;
if (process.env.GROQ_API_KEY) {
  botService = new BotService(process.env.GROQ_API_KEY);
  console.log('🤖 Bot service enabled');
} else {
  console.log('⚠️ GROQ_API_KEY not set — bots disabled');
}

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
const browserSockets = new Map(); // browserId -> userId (one per browser tab)

const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes

// Predefined popular interests
const AVAILABLE_INTERESTS = [
  'Gaming', 'Music', 'Movies', 'Anime', 'Sports',
  'Tech', 'Memes', 'Art', 'Books', 'Travel',
  'Food', 'Fitness', 'Fashion', 'Science', 'Photography',
  'Crypto', 'Comedy', 'K-Pop', 'Hip-Hop', 'Netflix'
];

// Track interest counts: interest -> count of users currently with that interest
const interestCounts = new Map();

// Get interest stats (sorted by popularity)
function getInterestStats() {
  return AVAILABLE_INTERESTS.map(interest => ({
    name: interest,
    count: interestCounts.get(interest) || 0
  })).sort((a, b) => b.count - a.count);
}

// Update interest counts when user joins/leaves with interests
function addUserInterests(interests) {
  for (const interest of interests) {
    interestCounts.set(interest, (interestCounts.get(interest) || 0) + 1);
  }
}

function removeUserInterests(interests) {
  for (const interest of interests) {
    const count = (interestCounts.get(interest) || 1) - 1;
    if (count <= 0) interestCounts.delete(interest);
    else interestCounts.set(interest, count);
  }
}

// Generate unique user ID
function generateUserId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Track user interests per user
const userInterestsMap = new Map(); // userId -> interests[]

const INTEREST_MATCH_TIMEOUT = 15000; // 15 seconds strict interest matching

// Find a match for a user (strict interest first 15s, then random)
function findMatch(userId, interests = []) {
  const hasInterests = interests.length > 0;
  const userWaitEntry = waitingUsers.get(userId);
  const userWaitTime = userWaitEntry ? Date.now() - userWaitEntry.timestamp : 0;

  // Normalize interests for comparison (case-insensitive)
  const normalizedInterests = interests.map(i => i.toLowerCase().trim());

  if (hasInterests) {
    // Pass 1: Try to find someone with common interests
    for (const [waitingId, waitingUser] of waitingUsers) {
      if (waitingId === userId) continue;
      if (waitingUser.interests.length === 0) continue;

      const waitingNormalized = waitingUser.interests.map(i => i.toLowerCase().trim());
      const hasCommon = normalizedInterests.some(i => waitingNormalized.includes(i));
      if (hasCommon) return waitingId;
    }

    // If still within 15s, keep waiting for interest match
    if (userWaitTime < INTEREST_MATCH_TIMEOUT) {
      return null;
    }
  }

  // Pass 2: No interests OR timed out — match with anyone available
  for (const [waitingId, waitingUser] of waitingUsers) {
    if (waitingId === userId) continue;

    // If the OTHER user has interests and is still in strict mode, skip them
    // (let them keep waiting for their interest match)
    if (waitingUser.interests.length > 0) {
      const otherWaitTime = Date.now() - waitingUser.timestamp;
      if (otherWaitTime < INTEREST_MATCH_TIMEOUT) continue;
    }

    return waitingId;
  }

  // Pass 3: If we have no interests, match with ANYONE regardless of their timer
  if (!hasInterests) {
    for (const [waitingId] of waitingUsers) {
      if (waitingId !== userId) return waitingId;
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

  // Find common interests
  const user1Interests = (userInterestsMap.get(user1Id) || []).map(i => i.toLowerCase().trim());
  const user2Interests = (userInterestsMap.get(user2Id) || []).map(i => i.toLowerCase().trim());
  const commonInterests = (userInterestsMap.get(user1Id) || []).filter(i =>
    user2Interests.includes(i.toLowerCase().trim())
  );

  const matchMsg = commonInterests.length > 0
    ? `Matched on: ${commonInterests.join(', ')} 🎯`
    : "You're chatting with a random stranger. Say hi!";

  const user1Ws = userSockets.get(user1Id);
  const user2Ws = userSockets.get(user2Id);

  if (user1Ws && user1Ws.readyState === 1) {
    user1Ws.send(JSON.stringify({
      type: 'matched',
      partnerId: user2Id,
      message: matchMsg
    }));
  }

  if (user2Ws && user2Ws.readyState === 1) {
    user2Ws.send(JSON.stringify({
      type: 'matched',
      partnerId: user1Id,
      message: matchMsg
    }));
  }
}

// End a chat session (keeps user connected, just cleans up pairing)
function endChat(userId) {
  const partnerId = activePairs.get(userId);

  if (partnerId) {
    // Clean up bot if partner is a bot
    if (botService && botService.isBot(partnerId)) {
      botService.removeBot(partnerId);
      userSockets.delete(partnerId);
    } else {
      const partnerWs = userSockets.get(partnerId);
      if (partnerWs && partnerWs.readyState === 1) {
        partnerWs.send(JSON.stringify({
          type: 'partner_disconnected',
          message: 'Stranger has disconnected.'
        }));
      }
    }
    activePairs.delete(partnerId);
    activePairs.delete(userId);
  }

  waitingUsers.delete(userId);
}

// Fully disconnect a user (when WebSocket closes)
function disconnectUser(userId) {
  endChat(userId);
  const interests = userInterestsMap.get(userId) || [];
  removeUserInterests(interests);
  userInterestsMap.delete(userId);
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

  // Parse browserId from query string
  const url = new URL(req.url, 'http://localhost');
  const browserId = url.searchParams.get('browserId');

  // Kick existing tab if same browser already connected
  if (browserId && browserSockets.has(browserId)) {
    const oldUserId = browserSockets.get(browserId);
    const oldWs = userSockets.get(oldUserId);
    if (oldWs && oldWs.readyState === 1) {
      console.log(`Duplicate tab detected for browserId: ${browserId}, closing old tab`);
      oldWs.send(JSON.stringify({
        type: 'duplicate_tab',
        message: 'You opened ShadowChat in another tab. This tab has been disconnected.'
      }));
      oldWs.close();
    }
    // Clean up old session
    endChat(oldUserId);
    waitingUsers.delete(oldUserId);
    userSockets.delete(oldUserId);
    lastActivity.delete(oldUserId);
  }

  // Register this connection
  userSockets.set(userId, ws);
  if (browserId) browserSockets.set(browserId, userId);

  console.log(`User connected: ${userId}, Total connections: ${wss.clients.size}`);

  // Send user their ID, online count, and interest stats
  ws.send(JSON.stringify({
    type: 'connected',
    userId: userId,
    onlineCount: wss.clients.size,
    interests: getInterestStats()
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
        case 'get_interests':
          ws.send(JSON.stringify({
            type: 'interest_stats',
            interests: getInterestStats()
          }));
          break;

        case 'find_match':
          // Remove from waiting if already there
          waitingUsers.delete(userId);

          // Track this user's interests
          const userInterests = (message.interests || []).filter(i => AVAILABLE_INTERESTS.includes(i));
          // Remove old interests, add new ones
          const oldInterests = userInterestsMap.get(userId) || [];
          removeUserInterests(oldInterests);
          userInterestsMap.set(userId, userInterests);
          addUserInterests(userInterests);

          // Try to find a match
          const matchId = findMatch(userId, userInterests);

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
            const msgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
            const ts = Date.now();
            const partnerWs = userSockets.get(partnerId);
            if (partnerWs && partnerWs.readyState === 1) {
              partnerWs.send(JSON.stringify({
                type: 'message',
                from: 'stranger',
                text: message.text,
                messageId: msgId,
                timestamp: ts
              }));
            }

            // Confirm to sender with same messageId
            ws.send(JSON.stringify({
              type: 'message_sent',
              text: message.text,
              messageId: msgId,
              timestamp: ts
            }));

            // If partner is a bot, get bot response
            if (botService && botService.isBot(partnerId)) {
              // Show typing indicator
              setTimeout(() => {
                ws.send(JSON.stringify({ type: 'typing', isTyping: true }));
              }, 300 + Math.random() * 700);

              // Get bot response with realistic delay
              botService.getResponse(partnerId, message.text).then(botReply => {
                if (!botReply || !activePairs.has(userId)) return;
                const delay = botService.getTypingDelay(botReply);

                setTimeout(() => {
                  if (!activePairs.has(userId)) return;
                  // Stop typing
                  ws.send(JSON.stringify({ type: 'typing', isTyping: false }));

                  // Send bot message
                  const botMsgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
                  ws.send(JSON.stringify({
                    type: 'message',
                    from: 'stranger',
                    text: botReply,
                    messageId: botMsgId,
                    timestamp: Date.now()
                  }));
                }, delay);
              });
            }
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

        case 'reaction':
          const reactionPartnerId = activePairs.get(userId);
          if (reactionPartnerId) {
            const reactionPartnerWs = userSockets.get(reactionPartnerId);
            if (reactionPartnerWs && reactionPartnerWs.readyState === 1) {
              reactionPartnerWs.send(JSON.stringify({
                type: 'reaction_received',
                messageId: message.messageId,
                emoji: message.emoji
              }));
            }
          }
          break;

        case 'stop_chat':
          endChat(userId);
          ws.send(JSON.stringify({
            type: 'chat_ended',
            message: 'You ended the chat.'
          }));
          break;

        case 'new_chat':
          // End current chat if any (but keep socket alive)
          endChat(userId);

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

        // Game messages — just relay to partner
        case 'game_invite':
        case 'game_accept':
        case 'game_decline':
        case 'game_move':
        case 'game_leave': {
          const gamePartnerId = activePairs.get(userId);
          if (gamePartnerId) {
            const gamePartnerWs = userSockets.get(gamePartnerId);
            if (gamePartnerWs && gamePartnerWs.readyState === 1) {
              gamePartnerWs.send(JSON.stringify({
                type: message.type,
                game: message.game,
                data: message.data,
              }));
            }
          }
          break;
        }

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
    // Clean up browserId mapping if it still points to this user
    if (browserId && browserSockets.get(browserId) === userId) {
      browserSockets.delete(browserId);
    }
    // Notify everyone about updated count (after a short delay so wss.clients is updated)
    setTimeout(() => broadcastOnlineCount(), 100);
    disconnectUser(userId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    disconnectUser(userId);
  });

  // Heartbeat: ping every 30 seconds, allow 2 missed pongs before terminating
  let missedPongs = 0;

  ws.on('pong', () => {
    missedPongs = 0;
  });

  const pingInterval = setInterval(() => {
    if (ws.readyState !== 1) {
      clearInterval(pingInterval);
      return;
    }

    missedPongs++;
    if (missedPongs > 2) {
      // Connection is dead - 2+ pongs missed (~60s unresponsive)
      console.log(`Heartbeat failed for user ${userId}, terminating`);
      clearInterval(pingInterval);
      ws.terminate();
      return;
    }

    ws.ping();
  }, 30000);

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

// Periodic matchmaking sweep — for users whose interest timeout expired
setInterval(() => {
  for (const [userId, waitingUser] of waitingUsers) {
    const matchId = findMatch(userId, waitingUser.interests);
    if (matchId) {
      waitingUsers.delete(matchId);
      waitingUsers.delete(userId);
      pairUsers(userId, matchId);
      console.log(`Sweep matched: ${userId} <-> ${matchId}`);
      break; // One match per sweep to avoid iterator issues
    }
  }
}, 3000);

// Bot fallback — if user has been waiting 30s+ with no match, pair with bot
const BOT_FALLBACK_TIMEOUT = 30000;
setInterval(() => {
  if (!botService) return;

  for (const [userId, waitingUser] of waitingUsers) {
    const waitTime = Date.now() - waitingUser.timestamp;
    if (waitTime >= BOT_FALLBACK_TIMEOUT) {
      // Create a bot for this user
      const botId = 'bot-' + generateUserId();
      const persona = botService.createBot(botId, waitingUser.interests);

      // Set up bot in system (no actual WebSocket, just track in maps)
      userSockets.set(botId, { readyState: 0 }); // Fake ws, won't be used for sending
      userInterestsMap.set(botId, persona.interests);

      // Remove from waiting
      waitingUsers.delete(userId);

      // Pair them
      activePairs.set(userId, botId);
      activePairs.set(botId, userId);

      // Send matched message to user
      const userWs = userSockets.get(userId);
      const commonInterests = (waitingUser.interests || []).filter(i =>
        persona.interests.map(p => p.toLowerCase()).includes(i.toLowerCase())
      );
      const matchMsg = commonInterests.length > 0
        ? `Matched on: ${commonInterests.join(', ')} 🎯`
        : "You're chatting with a random stranger. Say hi!";

      if (userWs && userWs.readyState === 1) {
        userWs.send(JSON.stringify({
          type: 'matched',
          partnerId: botId,
          message: matchMsg
        }));
      }

      // Bot sends greeting after a short delay
      setTimeout(async () => {
        if (!activePairs.has(userId)) return;
        const greeting = await botService.getGreeting(botId);

        // Show typing first
        if (userWs && userWs.readyState === 1) {
          userWs.send(JSON.stringify({ type: 'typing', isTyping: true }));
        }

        setTimeout(() => {
          if (!activePairs.has(userId) || !userWs || userWs.readyState !== 1) return;
          userWs.send(JSON.stringify({ type: 'typing', isTyping: false }));
          userWs.send(JSON.stringify({
            type: 'message',
            from: 'stranger',
            text: greeting,
            messageId: 'msg-' + Date.now() + '-bot',
            timestamp: Date.now()
          }));
        }, 1000 + Math.random() * 1500);
      }, 1500 + Math.random() * 2000);

      console.log(`🤖 Bot matched: ${userId} <-> ${botId} (${persona.name})`);
      break;
    }
  }
}, 5000);
