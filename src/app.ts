import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { testConnection } from './config/database';
import routes from './routes';
import { sendError } from './utils/apiResponse';
import { createServer } from 'http';
import { initWebSocketServer } from './services/websocketService';

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// 创建HTTP服务器
const server = createServer(app);

// 初始化WebSocket服务器
initWebSocketServer(server);

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || '',
    'http://localhost:3001',
    process.env.GUEST_CLIENT_URL || '*'
  ],
  methods: process.env.CORS_ALLOW_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: process.env.CORS_ALLOW_HEADERS?.split(',') || ['Content-Type', 'Authorization'],
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', limiter);

// 保留原始请求体（用于签名验证等）- 必须放在最前面
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));



// 解析JSON请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api', routes);

// 通用健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'payment-callback-service'
  });
});

// 根路由
app.get('/', (req, res) => {
  res.send('Payment Callback API Service is Running');
});

// 404处理
app.use((req, res) => {
  sendError(res, 'Resource not found', 404);
});

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ 服务器错误:', err.stack);
  sendError(res, 'Internal server error', 500);
});

// 启动服务器
testConnection()
  .then(() => {
    console.log('✅ 数据库连接成功');

    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 服务器运行在端口: ${PORT}`);
      console.log(`🔗 内网地址: http://localhost:${PORT}`);
      console.log(`🌐 公网回调地址: https://joella-hydrometallurgical-consuela.ngrok-free.dev/api/public/payment/callback`);
      console.log('✅ 服务已启动，等待收钱吧回调请求...\n');
    });
  })
  .catch((error) => {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  });

export default app;