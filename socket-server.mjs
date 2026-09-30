import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = parseInt(process.env.SOCKET_PORT || '4001', 10);

const httpServer = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
        service: 'astraiv-socket-server',
        port: PORT,
        clients: io ? io.engine?.clientsCount : 0,
      })
    );
    return;
  }

  if (req.method === 'POST' && req.url === '/api/broadcast') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const event = payload.event || 'new_enquiry';
        const data = payload.data || payload;
        console.log(`[Socket Server] Broadcast via POST /api/broadcast -> event: ${event}`, data?.id || '');
        io.emit(event, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, event }));
      } catch (err) {
        console.error('[Socket Server] Error parsing broadcast payload:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', (socket) => {
  console.log(`[Socket Server] Client connected: ${socket.id} (Total: ${io.engine.clientsCount})`);

  socket.on('submit_enquiry', (data) => {
    console.log('[Socket Server] submit_enquiry received from socket client:', data?.id || '');
    io.emit('new_enquiry', data);
  });

  socket.on('new_enquiry', (data) => {
    console.log('[Socket Server] new_enquiry received from socket client:', data?.id || '');
    io.emit('new_enquiry', data);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket Server] Client disconnected: ${socket.id} (Reason: ${reason})`);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Astraiv Socket Server] Listening on http://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[Socket Server] SIGTERM received. Closing server...');
  httpServer.close();
});
