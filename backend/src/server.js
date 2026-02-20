const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8082',
  'http://localhost:8084',
  'http://localhost:8085',
  'http://127.0.0.1:8085',
  'https://web-ten-theta-34.vercel.app',
];

// Also allow any *.vercel.app subdomain for preview deploys
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

const io = socketIO(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/venues', require('./routes/venues'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Socket.io connection
io.on('connection', (socket) => {
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
  });

  socket.on('leave-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
  });

  socket.on('disconnect', () => {
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
});

module.exports = { app, io };
