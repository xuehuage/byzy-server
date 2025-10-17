import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt'; // 导入JwtPayload类型
import { UserRole } from '../types/database.types';

/**
 * 验证用户是否已登录（解析JWT令牌）
 * 注意：Request类型扩展已移至src/types/express.d.ts，避免冲突
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. 从请求头获取Authorization
    const authHeader = req.headers.authorization;
    // 2. 检查Authorization格式
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.'
      });
    }

    // 3. 提取并验证令牌
    const token = authHeader.split(' ')[1]; // 分割"Bearer "和令牌部分
    const decoded = verifyToken(token) as JwtPayload; // 明确类型

    // 4. 将解析后的用户信息存入req，供后续接口使用
    req.user = decoded;
    next(); // 验证通过，继续执行后续中间件/控制器
  } catch (error) {
    // 令牌无效或过期
    return res.status(401).json({
      success: false,
      message: '无效的token.'
    });
  }
};

/**
 * 验证用户是否为超级管理员
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  // 使用统一的JwtPayload类型，避免类型冲突
  if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Requires super admin privileges.'
    });
  }
  next();
};
