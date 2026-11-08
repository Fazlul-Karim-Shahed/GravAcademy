import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import apiRouter from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rolling in-memory metrics history (last 20 sample points, stored on server)
interface MetricPoint {
  time: string;
  dbLatencyMs: number;
  memoryRssMB: number;
}
const metricsHistory: MetricPoint[] = [];
const MAX_HISTORY = 20;

setInterval(async () => {
  try {
    let dbLatencyMs = -1;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const dbStart = Date.now();
      await mongoose.connection.db?.admin().ping();
      dbLatencyMs = Date.now() - dbStart;
    }
    const mem = process.memoryUsage();
    metricsHistory.push({
      time: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka' }),
      dbLatencyMs: dbLatencyMs >= 0 ? dbLatencyMs : 60,
      memoryRssMB: Math.round(mem.rss / (1024 * 1024)),
    });
    if (metricsHistory.length > MAX_HISTORY) {
      metricsHistory.shift();
    }
  } catch (e) {}
}, 3000);

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        process.env.CLIENT_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ].filter(Boolean);

      // Allow vercel preview / production deployments or matched client URL
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for coaching platform web clients
    },
    credentials: true,
  })
);

// Logging & Parsing
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve command center static dashboard
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Telemetry & Status API Endpoint
app.get('/api/status', async (req, res) => {
  const startTime = Date.now();
  let dbLatencyMs = -1;
  let dbStatus = 'disconnected';

  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const dbStart = Date.now();
      await mongoose.connection.db?.admin().ping();
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error';
  }

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  res.json({
    status: 'operational',
    service: 'Grav Academy Cloud Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    apiLatencyMs: Date.now() - startTime,
    history: metricsHistory,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      name: mongoose.connection.name || 'grav_academy',
    },
    system: {
      uptimeSeconds,
      uptimeFormatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
      memoryRssMB: Math.round(memory.rss / (1024 * 1024)),
      memoryHeapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
      totalSystemMemMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeSystemMemMB: Math.round(os.freemem() / (1024 * 1024)),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Cloud vCPU',
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      nodeVersion: process.version,
    },
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount Versioned API
app.use('/api/v1', apiRouter);

// Centralized Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

/**
 * Self-ping Keep-Alive mechanism to prevent free hosting platforms
 * (Render / Vercel Edge / Glitch) from spinning down or sleeping due to inactivity.
 */
const setupSelfPing = () => {
  const SERVER_URL = process.env.SERVER_URL || 'https://gravacademy.onrender.com';
  const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  // Initial delay of 1 minute before starting regular self-pings
  setTimeout(() => {
    console.log(`[Keep-Alive] Initializing self-ping monitor for ${SERVER_URL}/health`);
    
    setInterval(async () => {
      try {
        const pingUrl = `${SERVER_URL}/health`;
        const res = await fetch(pingUrl, {
          headers: { 'User-Agent': 'GravAcademy-KeepAlive-Bot/1.0' },
        });
        if (res.ok) {
          console.log(`[Keep-Alive] Self ping success at ${new Date().toLocaleTimeString()} - Status: ${res.status}`);
        } else {
          console.warn(`[Keep-Alive] Self ping returned status ${res.status}`);
        }
      } catch (err: any) {
        console.error(`[Keep-Alive] Ping warning:`, err?.message || err);
      }
    }, PING_INTERVAL_MS);
  }, 60 * 1000);
};

// Start Server & Connect MongoDB Atlas
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Grav Academy API Server running on http://localhost:${PORT}`);
    setupSelfPing();
  });
};

startServer();
