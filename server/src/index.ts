import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer } from 'http';
import { initWebSocket } from './ws';
import { initStore } from './db/store';
import { startAIDetector } from './ai/detector';
import { startPatrolSimulator } from './ai/patrol';
import { seedIfEmpty } from './db/seed';
import { requestLogger, errorHandler } from './middleware/logger';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import droneRoutes from './routes/drones';
import chatRoutes from './routes/chat';
import statsRoutes from './routes/stats';
import adminRoutes from './routes/admin';
import analyticsRoutes from './routes/analytics';

async function main() {
  await initStore();

  const app = express();
  const server = createServer(app);
  const PORT = process.env.PORT || 3001;
  const isProduction = process.env.NODE_ENV === 'production';

  // Trust proxy for rate limiting behind nginx
  if (isProduction) app.set('trust proxy', 1);

  // Security
  app.use(helmet({
    contentSecurityPolicy: false, // SPA serves from Vite/nginx
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8080',
  ];
  app.use(cors({ origin: allowedOrigins, credentials: true }));

  // Rate limiting — production only
  if (isProduction) {
    app.use('/api', rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      message: { error: '请求过于频繁，请稍后再试' },
    }));
    app.use('/api/auth/login', rateLimit({
      windowMs: 60 * 1000,
      max: 20,
      message: { error: '登录尝试过多，1分钟后再试' },
    }));
  }
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Static — AI 检测截图
  app.use('/api/screenshots', express.static(path.resolve(process.cwd(), 'data', 'screenshots')));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/drones', droneRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      time: new Date().toISOString(),
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  // WebSocket
  initWebSocket(server);

  // Auto-seed on first run
  seedIfEmpty();

  server.listen(PORT, () => {
    console.log(`🛩️  低空平台 API Server running on http://localhost:${PORT}`);
    console.log(`   WebSocket on ws://localhost:${PORT}/ws`);
    console.log(`   Mode: ${isProduction ? 'production' : 'development'}`);

    const aiInterval = parseInt(process.env.AI_INTERVAL || '300000');
    const patrolInterval = parseInt(process.env.PATROL_INTERVAL || '3000');
    if (aiInterval > 0) startAIDetector(aiInterval);
    else console.log('   AI 检测模拟器已关闭');
    if (patrolInterval > 0) startPatrolSimulator(patrolInterval);
    else console.log('   巡逻模拟器已关闭');
  });
}

main().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
