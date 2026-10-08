/**
 * @file admin/src/instrumentation.ts
 * @description Next.js server lifecycle hook to ensure Socket.IO server is running on port 4001.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const net = await import('net');
      const testSocket = new net.Socket();
      testSocket.setTimeout(600);

      testSocket.on('connect', () => {
        testSocket.destroy();
        console.log('[Instrumentation] Socket.IO server is already active on port 4001.');
      });

      testSocket.on('error', async () => {
        testSocket.destroy();
        try {
          const { createServer } = await import('http');
          const { Server } = await import('socket.io');

          const PORT = parseInt(process.env.SOCKET_PORT || '4001', 10);
          const crypto = await import('crypto');
          const BROADCAST_SECRET = process.env.SOCKET_BROADCAST_SECRET || '';
          const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
            : [
                'http://localhost:3000',
                'http://localhost:3001',
                'https://www.astraivtechnologies.com',
                'https://superuser.admin.astraivtechnologies.com',
              ];

          const isOriginAllowed = (origin?: string) => {
            if (!origin) return true;
            if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) return true;
            return false;
          };

          const httpServer = createServer((req, res) => {
            const origin = req.headers.origin;
            if (isOriginAllowed(origin)) {
              res.setHeader('Access-Control-Allow-Origin', origin || '*');
            }
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-broadcast-secret');

            if (req.method === 'OPTIONS') {
              res.writeHead(204);
              res.end();
              return;
            }

            if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  status: 'ok',
                  service: 'instrumentation-socket-server',
                  port: PORT,
                })
              );
              return;
            }

            if (req.method === 'POST' && req.url === '/api/broadcast') {
              if (BROADCAST_SECRET) {
                const authHeader = (req.headers['x-broadcast-secret'] as string) || (req.headers['authorization'] as string)?.replace(/^Bearer\s+/i, '');
                if (!authHeader || authHeader.length !== BROADCAST_SECRET.length || !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(BROADCAST_SECRET))) {
                  res.writeHead(401, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Unauthorized broadcast' }));
                  return;
                }
              }

              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const event = payload.event || 'new_enquiry';
                  const data = payload.data || payload;
                  console.log(`[Embedded Socket Server] Broadcast event: ${event}`, data?.id || '');
                  io.emit(event, data);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, event }));
                } catch (err: unknown) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: (err as Error).message }));
                }
              });
              return;
            }

            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
          });

          const io = new Server(httpServer, {
            cors: {
              origin: (origin, callback) => {
                if (isOriginAllowed(origin)) {
                  callback(null, true);
                } else {
                  callback(new Error('Not allowed by CORS'));
                }
              },
              methods: ['GET', 'POST'],
            },
          });

          io.on('connection', (socket) => {
            console.log(`[Embedded Socket Server] Client connected: ${socket.id}`);
            socket.on('submit_enquiry', (data) => io.emit('new_enquiry', data));
            socket.on('new_enquiry', (data) => io.emit('new_enquiry', data));
          });

          httpServer.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code !== 'EADDRINUSE') {
              console.error('[Instrumentation] Embedded socket server error:', err);
            }
          });

          httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 [Instrumentation] Embedded Socket.IO server running on http://0.0.0.0:${PORT}`);
          });
        } catch (serverErr) {
          console.warn('[Instrumentation] Embedded socket initialization notice:', serverErr);
        }
      });

      testSocket.connect(4001, '127.0.0.1');
    } catch (e) {
      console.warn('[Instrumentation] Socket check notice:', e);
    }
  }
}
