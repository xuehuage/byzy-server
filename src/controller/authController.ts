/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendSuccess, sendError } from '../utils/apiResponse';
import authService from '../services/authService';
import { UserRole, UserWithoutPassword } from '../types';

// 验证请求数据的辅助函数
const validate = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendError(res, 'Validation failed', 400, errors.array());
    return false;
  }
  return true;
};

// 注册请求验证规则
export const registerValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('realname').notEmpty().withMessage('Real name is required'),
  body('phone').isMobilePhone('zh-CN').withMessage('Invalid phone number (must be a valid Chinese mobile number)'),
  body('email').isEmail().withMessage('Invalid email address'),
  // 根据登录用户角色动态验证角色参数
  body('role').custom((value, { req }) => {
    // 超级管理员可以创建任何角色
    if (req.user?.role === UserRole.SUPER_ADMIN) {
      return [UserRole.SUPER_ADMIN, UserRole.MANUFACTURER_ADMIN, UserRole.STAFF].includes(value);
    }
    // 厂商管理员只能创建职员角色
    if (req.user?.role === UserRole.MANUFACTURER_ADMIN) {
      return value === UserRole.STAFF;
    }
    return false;
  }).withMessage('Invalid role for current user'),
  body('manufacturer_id').optional().isInt().withMessage('Manufacturer ID must be an integer')
];

// 登录请求验证规则
export const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

/**
 * 更新用户信息的参数验证规则
 * 特点：所有字段均为可选（支持部分更新），但有格式限制
 */
export const updateUserValidation = [
  // 用户名不可更新（防止重复）
  body('username').not().exists().withMessage('Username cannot be updated'),

  // 密码可选，若提供则需至少6位
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  // 真实姓名可选，若提供则不可为空
  body('realname').optional().notEmpty().withMessage('Real name cannot be empty'),

  // 手机号可选，若提供则需符合中国手机号格式
  body('phone').optional().isMobilePhone('zh-CN').withMessage('Invalid phone number (must be a valid Chinese mobile number)'),

  // 邮箱可选，若提供则需符合邮箱格式
  body('email').optional().isEmail().withMessage('Invalid email address'),

  // 角色更新受权限控制
  body('role').optional().custom((value, { req }) => {
    // 只有超级管理员可以修改角色
    if (req.user?.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only super admin can update user role');
    }
    // 角色值必须合法
    return [UserRole.SUPER_ADMIN, UserRole.MANUFACTURER_ADMIN, UserRole.STAFF].includes(value);
  }).withMessage('Invalid role for current user'),

  // 厂商ID可选，若提供则需为整数
  body('manufacturer_id').optional().isInt().withMessage('Manufacturer ID must be an integer')
    // 若更新为厂商管理员，必须提供厂商ID
    .custom((value, { req }) => {
      if (req.body.role === UserRole.MANUFACTURER_ADMIN && !value) {
        throw new Error('Manufacturer ID is required for manufacturer admin');
      }
      return true;
    })
];

const authController = {


  /**
   * 用户登录
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      if (!validate(req, res)) return;
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      sendSuccess(res, result, '登录成功', 200);
    } catch (error) {
      console.error('登录错误:', error);
      // 根据错误类型返回对应状态码
      let code = 500;
      const message = (error as Error).message || '登录失败';

      // 特定错误码映射
      if (message.includes('不存在该账户') || message.includes('Invalid credentials')) {
        code = 401; // 认证失败
      } else if (message.includes('Account is not active')) {
        code = 403; // 账户未激活
      }

      sendError(res, message, code);
    }
  },

  /**
   * 获取当前登录用户信息
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req?.user) {
        sendError(res, 'User not authenticated', 401);
        return;
      }
      sendSuccess(res, { user: req.user }, 'Current user retrieved successfully');
    } catch (error) {
      console.error('Error in authController.getCurrentUser:', error);
      sendError(res, 'Failed to get current user');
    }
  },

  /**
   * 用户注册
   * - 超级管理员：可以创建所有角色用户
   * - 厂商管理员：只能创建本厂商的职员
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求数据
      if (!validate(req, res)) {
        return;
      }

      const userData = req.body;
      const currentUser = req.user

      // 权限控制逻辑
      if (currentUser?.role === UserRole.MANUFACTURER_ADMIN) {
        // 厂商管理员只能创建职员，并且强制关联自己的厂商ID
        userData.role = UserRole.STAFF;
        userData.manufacturer_id = currentUser.manufacturerId;
      } else if (currentUser?.role !== UserRole.SUPER_ADMIN) {
        // 既不是超级管理员也不是厂商管理员，拒绝访问
        sendError(res, 'No permission to create users', 403);
        return;
      }

      // 超级管理员创建厂商管理员时，必须指定厂商ID
      if (userData.role === UserRole.MANUFACTURER_ADMIN && !userData.manufacturer_id) {
        sendError(res, 'Manufacturer ID is required for manufacturer admin', 400);
        return;
      }

      const newUser = await authService.register(userData);
      sendSuccess(res, { user: newUser }, 'User registered successfully', 201);
    } catch (error) {
      console.error('Error in authController.register:', error);
      sendError(res, (error as Error).message || 'Failed to register user');
    }
  },
  /**
   * 更新用户信息（新增方法，使用上述验证规则）
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求数据
      if (!validate(req, res)) {
        return;
      }

      const { id } = req.params;
      const updateData = req.body;
      const currentUser = req.user;

      // 权限检查：仅超管或用户本人可更新（但角色只能超管修改）
      if (
        currentUser?.role !== UserRole.SUPER_ADMIN &&
        currentUser?.id !== Number(id)
      ) {
        sendError(res, 'No permission to update this user', 403);
        return;
      }

      // 执行更新
      const updatedUser = await authService.updateUser(Number(id), updateData);
      if (!updatedUser) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, { user: updatedUser }, 'User updated successfully');
    } catch (error) {
      console.error('Error in authController.updateUser:', error);
      sendError(res, (error as Error).message || 'Failed to update user');
    }
  }

};

export default authController;
