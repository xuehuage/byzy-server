import { Response } from 'express';
import { ApiResponse } from '../types/api.types';

// 成功响应
export const sendSuccess = <T = any>(
  res: Response,
  data: T = {} as T,
  message: string = '操作成功',
  code: number = 200
): void => {
  const response: ApiResponse<T> = { code, data, message };
  res.status(code).json(response);
};

// 错误响应
export const sendError = (
  res: Response,
  message: string = '服务器内部错误',
  code: number = 500,
  data: any = null
): void => {
  const response: ApiResponse = { code, data, message };
  res.status(code).json(response);
};