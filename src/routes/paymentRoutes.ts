// # 支付相关接口路由（挂载到/api/payment）
import express from 'express';
import { authenticate } from '../middleware/auth'; // 需登录验证
import { validateRequest } from '../middleware/validateRequest';
import { pay } from '../controller/pamentController';

const router = express.Router();

// 支付接口
router.post('/pay', pay);

// 其他接口（退款、查询等）类似配置...

export default router;