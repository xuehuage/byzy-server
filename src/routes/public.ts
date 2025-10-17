// src/routes/public.ts (新增文件)
import express from 'express';
import publicRateLimiter from '../middleware/rateLimit';
import { getPublicSchoolDetail, getPublicStudent } from '../controller/publicController';

const router = express.Router();

// 为公开接口添加更严格的速率限制
router.use(publicRateLimiter);





router.get('/students/query-by-idcard/:id_card', getPublicStudent);


// 公开查询学校详情
router.get('/school/:id', getPublicSchoolDetail);

export default router;