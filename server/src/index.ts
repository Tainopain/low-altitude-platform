import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initWebSocket } from './ws';
import { startAIDetector } from './ai/detector';
import { seedIfEmpty } from './db/seed';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import droneRoutes from './routes/drones';
import chatRoutes from './routes/chat';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// WebSocket
initWebSocket(server);

// Auto-seed on first run
seedIfEmpty();

server.listen(PORT, () => {
  console.log(`低空平台 API Server running on http://localhost:${PORT}`);
  console.log(`WebSocket on ws://localhost:${PORT}/ws`);

  // 启动 AI 检测模拟器（默认每 30 秒生成一条事件）
  const aiInterval = process.env.AI_INTERVAL ? parseInt(process.env.AI_INTERVAL) : 30000;
  startAIDetector(aiInterval);
});
