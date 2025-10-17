import jwt from 'jsonwebtoken';
import { User, UserRole, UserWithoutPassword } from '../types/database.types';



// 从环境变量获取JWT配置
const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET加载状态:', JWT_SECRET ? '已加载（长度：' + JWT_SECRET.length + '）' : '未加载');
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// 定义JWT payload结构（与auth中间件保持一致）
export interface JwtPayload {
  id: number;
  username: string;
  role: UserRole;
  manufacturerId: number | null | undefined;
}

export type ManufacturerIdType = JwtPayload['manufacturerId'];

// 生成JWT令牌
export const generateToken = (user: UserWithoutPassword): string => {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    manufacturerId: user.manufacturer_id,
  };

  // 生成令牌时打印关键信息（仅开发环境）
  console.log('生成令牌的payload:', payload);

  // 使用数字类型的过期时间（秒）
  const expiresInSeconds = process.env.JWT_EXPIRES_IN
    ? parseInt(process.env.JWT_EXPIRES_IN, 10)
    : 604800; // 默认7天
  console.log('令牌过期时间（秒）:', expiresInSeconds);

  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });
    console.log('令牌生成成功（前20位）:', token.slice(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('令牌生成失败:', error);
    throw new Error('Failed to generate token');
  }
};

// 验证JWT令牌并解析payload
export const verifyToken = (token: string): JwtPayload => {
  try {
    console.log('开始验证令牌（前20位）:', token.slice(0, 20) + '...');
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('令牌验证成功，解析结果:', decoded);
    return decoded;
  } catch (error) {
    console.error('令牌验证失败:', error);
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token: ' + error.message);
    } else {
      throw new Error('Token verification failed');
    }
  }
};

// 移除重复的Request扩展声明（已移至src/types/express.d.ts）
