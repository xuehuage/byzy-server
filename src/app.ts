
import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { testConnection } from './config/database';
import routes from './routes';
import { sendError } from './utils/apiResponse';


// 调试：打印加载的环境变量（仅开发环境使用，生产环境需删除）
console.log('✅ dotenv 加载的环境变量：');
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('GUEST_CLIENT_URL:', process.env.GUEST_CLIENT_URL);

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// 安全中间件
app.use(helmet()); // 增加HTTP头安全性
// 重点：配置CORS，关联.env中的前端地址
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || '',
    'http://localhost:3001',
    process.env.GUEST_CLIENT_URL || '*' //游客客户端域名
  ], // 仅允许前端地址跨域（替代默认的 "*"）
  methods: process.env.CORS_ALLOW_METHODS?.split(',') || ['GET', 'POST'], // 允许的HTTP方法
  allowedHeaders: process.env.CORS_ALLOW_HEADERS?.split(',') || ['Content-Type'], // 允许的请求头
  credentials: process.env.CORS_CREDENTIALS === 'true' // 是否允许跨域传递凭证
}));

// 请求限制（防止暴力攻击）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100个请求
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', limiter); // 仅对认证接口应用限制

// 解析JSON请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api', routes);

// 根路由
app.get('/', (req, res) => {
  res.send('School Uniform Management System API is running');
});

// 404处理
app.use((req, res) => {
  sendError(res, 'Resource not found', 404);
});

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  sendError(res, 'Internal server error', 500);
});

// 测试数据库连接并启动服务器
testConnection()
  .then(() => {
    console.log('Database connection established');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });

export default app;
