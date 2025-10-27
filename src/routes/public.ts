// src/routes/public.ts (新增文件)
import express from 'express';
import publicRateLimiter from '../middleware/rateLimit';
import { getPublicSchoolDetail, getPublicStudent } from '../controller/publicController';
import { prepay, prepayValidation, searchPaymentStatus } from '../controller/paymentController';
import { paymentCallback } from '../controller/paymentCallbackController';

const router = express.Router();

// 为公开接口添加更严格的速率限制
router.use(publicRateLimiter);





router.get('/students/query-by-idcard/:id_card', getPublicStudent);

router.post('/prepay', prepayValidation, prepay);

// 支付回调接口（第三方直接调用，无需认证但需签名验证）
router.get('/payment/status/:client_sn', searchPaymentStatus);


// 公开查询学校详情
router.get('/school/:id', getPublicSchoolDetail);

export default router;