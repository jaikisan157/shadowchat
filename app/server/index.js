import { server } from './websocket.js';

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🌑 ShadowChat WebSocket Server                       ║
║                                                        ║
║   Server running on port ${PORT}                        ║
║                                                        ║
║   Endpoints:                                           ║
║   - WebSocket: ws://localhost:${PORT}                   ║
║   - Health:   http://localhost:${PORT}/health           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});
