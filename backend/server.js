import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import testRoutes from './routes/testRoutes.js';
import freeResourceRoutes from './routes/freeResourceRoutes.js';
import brandingRoutes from './routes/brandingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes, { setupSocketHandlers } from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Attach socket server to req for API routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Route mounts
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/free-resources', freeResourceRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Setup Socket.io Real-Time Event Engine
setupSocketHandlers(io);

// Public endpoint for published public portals on Home page & website
app.get('/api/public-portals', async (req, res) => {
  try {
    const portals = await prisma.publicPortal.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { displayOrder: 'asc' }
    });
    res.json({ success: true, portals });
  } catch (error) {
    console.error('Fetch Published Public Portals Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch public portals.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'Sarvottam Diksha Real-Time Socket Server',
    timestamp: new Date().toISOString()
  });
});

httpServer.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Sarvottam Diksha Real-Time Server running on port ${PORT}`);
  console.log(`====================================================`);
});
