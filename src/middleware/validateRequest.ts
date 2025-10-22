// src/middleware/validateRequest.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse';

/**
 * 验证请求数据的中间件
 * 使用express-validator的验证结果
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (errors.array().length > 0) {
    sendError(res, errors.array()[0].msg, 400);
    return;
  }
  if (!errors.isEmpty()) {
    sendError(res, '字段验证错误');
    return;
  }
  next();
};
