// src/routes/paymentRoutes.ts
import express from 'express';
import { prepay, prepayValidation } from '../controller/paymentController';
import { paymentCallback } from '../controller/paymentCallbackController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 预下单接口（需认证）


export default router;