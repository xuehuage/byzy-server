import { Router } from 'express';
import { getUserMenus } from '../controller/menuController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 获取用户有权限的菜单（使用authenticate中间件验证登录）
router.get('/', authenticate, getUserMenus);

export default router;
