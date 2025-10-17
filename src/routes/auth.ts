// src/routes/auth.ts
import express from 'express';
import authController, { 
  registerValidation,
  updateUserValidation
} from '../controller/authController';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// 登录（公开）
router.post('/login', authController.login);

// 注册用户（权限在控制器中处理）
router.post(
  '/register',
  authenticate, // 需登录
  registerValidation,
  validateRequest,
  authController.register
);

// 编辑用户（包括角色调整，权限在控制器中处理）
router.patch(
  '/users/:id',
  authenticate, // 需登录
  updateUserValidation,
  validateRequest,
  authController.updateUser
);

export default router;
