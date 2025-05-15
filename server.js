/**
 * Custom Next.js server with WebSocket support
 *
 * This server extends the default Next.js server to add WebSocket support
 * using Socket.IO. It initializes the WebSocket server and handles WebSocket
 * connections.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

// Determine if we're in development or production mode
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Prepare the Next.js app
app.prepare().then(() => {
  // Create the HTTP server
  const server = createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);

      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize Socket.IO server
  const io = new Server(server, {
    path: '/api/websocket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store the Socket.IO server in the global scope for access from other modules
  global.__ATLAS_ERP_IO = io;

  // Handle WebSocket connections
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Handle disconnections
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    // Handle room subscriptions
    socket.on('subscribe', (room) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    // Handle room unsubscriptions
    socket.on('unsubscribe', (room) => {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    // Send a welcome message
    socket.emit('welcome', {
      message: 'Connected to Atlas-ERP WebSocket server',
      timestamp: new Date().toISOString(),
    });
  });

  // Simulate metrics updates for testing
  setInterval(() => {
    const metrics = [
      'cpu', 'memory', 'storage', 'documents', 'users', 'agents', 'workflows'
    ];

    const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
    let newValue;

    if (randomMetric === 'cpu' || randomMetric === 'memory' || randomMetric === 'storage') {
      // For percentage metrics, generate a value between 10% and 90%
      newValue = Math.floor(Math.random() * 80) + 10;
    } else if (randomMetric === 'documents') {
      // For documents, generate a value between 100 and 500
      newValue = Math.floor(Math.random() * 400) + 100;
    } else if (randomMetric === 'users') {
      // For users, generate a value between 1 and 20
      newValue = Math.floor(Math.random() * 19) + 1;
    } else if (randomMetric === 'agents') {
      // For agent executions, generate a value between 0 and 50
      newValue = Math.floor(Math.random() * 50);
    } else if (randomMetric === 'workflows') {
      // For workflow runs, generate a value between 0 and 30
      newValue = Math.floor(Math.random() * 30);
    }

    const update = {
      id: randomMetric,
      name: randomMetric.charAt(0).toUpperCase() + randomMetric.slice(1),
      value: newValue,
      previousValue: 0,
      change: 0,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };

    io.emit('metrics-update', update);
  }, 5000); // Send an update every 5 seconds

  // Start the server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server initialized on ws://${hostname}:${port}/api/websocket`);
  });
});
