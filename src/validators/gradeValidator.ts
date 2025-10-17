// src/validators/gradeValidator.ts
import { body } from 'express-validator';

/**
 * 创建年级的验证规则
 */
export const createGradeValidation = [
  body('name')
    .notEmpty().withMessage('Grade name is required')
    .isString().withMessage('Name must be a string')
    .trim(),

  body('school_id')
    .notEmpty().withMessage('School ID is required')
    .isInt({ min: 1 }).withMessage('School ID must be a positive integer'),

  // 可选的班级数组验证
  body('classes')
    .optional()
    .isArray().withMessage('Classes must be an array')
    .custom(classes => {
      classes.forEach((cls: any) => {
        if (typeof cls.name !== 'string' || cls.name.trim() === '') {
          throw new Error('Each class must have a valid name');
        }
        if (!Number.isInteger(cls.class_order) || cls.class_order < 1) {
          throw new Error('Class order must be a positive integer');
        }
      });
      return true;
    })
];

/**
 * 更新年级的验证规则
 */
export const updateGradeValidation = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .trim(),


  // 可选的班级数组验证（同创建规则）
  body('classes')
    .optional()
    .isArray().withMessage('Classes must be an array')
    .custom(classes => {
      classes.forEach((cls: any) => {
        if (cls.id && (!Number.isInteger(cls.id) || cls.id < 1)) {
          throw new Error('Class ID must be a positive integer');
        }
        if (typeof cls.name !== 'string' || cls.name.trim() === '') {
          throw new Error('Each class must have a valid name');
        }
        if (!Number.isInteger(cls.class_order) || cls.class_order < 1) {
          throw new Error('Class order must be a positive integer');
        }
      });
      return true;
    })
];