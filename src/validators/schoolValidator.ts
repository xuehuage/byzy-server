import { body } from 'express-validator';

/**
 * 创建学校的验证规则
 */
export const createSchoolValidation = [
  body('name')
    .notEmpty().withMessage('学校名称重复！')
    .isString().withMessage('学校名称为字符串')
    .trim(),

];

/**
 * 更新学校的验证规则
 */
export const updateSchoolValidation = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .trim(),


];
