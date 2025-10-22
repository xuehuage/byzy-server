import { Response } from 'express';
import { ApiResponse } from '../types/api.types';

// 成功响应
export const sendSuccess = <T = any>(
  res: Response,
  data: T = {} as T,
  message: string = '操作成功',
): void => {
  const response: ApiResponse<T> = { code: 200, data, message };
  res.status(200).json(response);
};

// 错误响应：HTTP 200 + 自定义业务码（code）
export const sendError = (
  res: Response,
  message: string = '操作失败',
  httpStatus: number = 200, // 固定 HTTP 200
  code: number = 500 // 业务错误码（默认500，可自定义）
) => {
  res.status(httpStatus).json({
    code, // 业务错误码（如404表示未找到）
    data: null,
    message
  });
};