import express from 'express';
import gradeController from '../controller/gradeController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createGradeValidation, updateGradeValidation } from '../validators/gradeValidator';

const router = express.Router();

// 基础路由：/api/grades
router.post(
  '/',
  authenticate,
  createGradeValidation, // 执行验证规则
  validateRequest, // 校验验证结果
  gradeController.createGrade
);

// 学校的年级：/api/grades/school/:schoolId
router.get(
  '/school/:schoolId',
  authenticate,
  gradeController.getGradesBySchool
);

// 年级详情操作：/api/grades/:gradeId
router.put(
  '/:gradeId',
  authenticate,
  updateGradeValidation, // 执行验证规则
  validateRequest, // 校验验证结果
  gradeController.updateGrade
);

router.delete(
  '/:gradeId',
  authenticate,
  gradeController.deleteGrade
);


export default router;
