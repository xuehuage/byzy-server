import express from 'express';
import schoolController from '../controller/schoolController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createSchoolValidation, updateSchoolValidation } from '../validators/schoolValidator';

const router = express.Router();

// 所有学校接口都需要先认证
router.use(authenticate);

// 创建学校
router.post(
  '/created',
  createSchoolValidation,
  validateRequest,
  schoolController.createSchool
);

// 获取厂商的所有学校
router.get('/list', schoolController.getManufacturerSchools);

// 获取厂商的所有学校
router.get('/list-with-class', schoolController.getSchoolsWithRelations);
// 按条件查询学校列表
router.get(
  '/search',
  authenticate, // 需登录
  schoolController.getSchoolsByConditions
);

// 获取单个学校详情
router.get('/:schoolId', schoolController.getSchoolById);

// 更新学校信息（包括年级）
router.put(
  '/:schoolId',
  updateSchoolValidation,
  validateRequest,
  schoolController.updateSchool
);




export default router;
