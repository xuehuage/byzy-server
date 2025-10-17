import express from 'express';
import manufacturerController, {
  createManufacturerValidation
} from '../controller/manufacturerController';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import manufacturerUserController from '../controller/manufacturerUserController';
import schoolRoutes from './schools';

const router = express.Router();

// 1. 创建厂商（仅超管）
router.post(
  '/create',
  authenticate,
  requireSuperAdmin,
  createManufacturerValidation,
  validateRequest,
  manufacturerController.create
);

// 更新厂商信息（仅超管）
router.put(
  '/:id',
  authenticate,
  requireSuperAdmin,
  validateRequest,
  manufacturerController.update
);

// 按条件查询厂商列表
router.get(
  '/search',
  authenticate,
  requireSuperAdmin,
  manufacturerController.search
);

// 2. 删除厂商（仅超管）
router.delete(
  '/:id',
  authenticate,
  requireSuperAdmin,
  manufacturerController.delete
);

// 3. 查询厂商列表（仅超管）
router.get(
  '/list',
  authenticate,
  requireSuperAdmin,
  manufacturerController.getAll
);

router.get(
  '/listWithSchools',
  authenticate,
  requireSuperAdmin,
  manufacturerController.getAllWithSchools
);

// 4. 静态路由：查询本厂商用户
router.get(
  '/users',
  authenticate,
  manufacturerUserController.getManufacturerUsers
);

// 5. 静态路由：删除本厂商职员（新增路由）
router.delete(
  '/users/:userId',
  authenticate,
  manufacturerUserController.deleteManufacturerStaff
);

// 6. 动态路由：查询单个厂商
router.get(
  '/:id',  // 限制为数字ID，避免匹配冲突
  authenticate,
  manufacturerController.getById
);

// 挂载学校路由：所有学校接口路径为 /api/manufacturers/schools
router.use('/schools', schoolRoutes);

export default router;
