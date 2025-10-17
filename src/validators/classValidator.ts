import { body } from 'express-validator';

/**
 * 创建班级的验证规则
 */
export const createClassValidation = [
  body('name')
    .notEmpty().withMessage('Class name is required')
    .isString().withMessage('Name must be a string')
    .trim(),
  
  body('class_order')
    .notEmpty().withMessage('Class order is required')
    .isInt({ min: 1 }).withMessage('Class order must be a positive integer')
];

/**
 * 更新班级的验证规则
 */
export const updateClassValidation = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .trim(),
  
  body('class_order')
    .optional()
    .isInt({ min: 1 }).withMessage('Class order must be a positive integer')
];
