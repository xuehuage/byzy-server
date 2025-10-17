import express from 'express';
import classController from '../controller/classController';
import { authenticate } from '../middleware/auth';
import { createClassValidation, updateClassValidation } from '../validators/classValidator';

const router = express.Router();

// // 为年级创建班级：/api/grades/:gradeId/classes
// router.post(
//   '/grades/:gradeId/classes',
//   authenticate,
//  createClassValidation,
//   classController.createClass
// );

// // 获取年级的班级：/api/grades/:gradeId/classes
// router.get(
//   '/grades/:gradeId/classes',
//   authenticate,
//   classController.getClassesByGrade
// );

// // 班级详情操作：/api/classes/:classId
// router.put(
//   '/classes/:classId',
//   authenticate,
//   updateClassValidation,
//   classController.updateClass
// );

// router.delete(
//   '/classes/:classId',
//   authenticate,
//   classController.deleteClass
// );

export default router;
