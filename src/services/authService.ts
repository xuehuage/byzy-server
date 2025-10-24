// src/services/authService.ts
import bcrypt from 'bcryptjs';
import UserModel, { mapRowToUserWithoutPassword } from '../models/User';
import { generateToken } from '../utils/jwt';
import { User, UserRole, Status, CreateUserRequest, AuthResponse, UserRow, UserWithoutPassword } from '../types';
import { executeTransaction } from '../config/database';
import { sendError } from '../utils/apiResponse';
import { UpsertResult } from 'mariadb/*';

// 密码加密的盐值强度
const SALT_ROUNDS = 10;

const authService = {
  /**
   * 用户注册
   */
  async register(userData: CreateUserRequest): Promise<UserWithoutPassword> {
    try {
      // 步骤1：检查用户名是否存在（单独查询，不放入事务，避免长事务）
      const existingUser = await UserModel.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // 步骤2：加密密码
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      if (!hashedPassword) {
        throw new Error('Failed to hash password');
      }

      // 步骤3：用事务执行「插入用户 + 查询新用户」
      const transactionQueries = [
        // 3.1 插入新用户
        {
          sql: `
            INSERT INTO users (username, password, realname, phone, email, role, manufacturer_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          params: [
            userData.username,
            hashedPassword,
            userData.realname,
            userData.phone,
            userData.email,
            userData.role,
            userData.manufacturer_id || null,
            userData.status || 1
          ]
        },
        // 3.2 查询刚插入的用户（利用 LAST_INSERT_ID() 获取最新ID）
        {
          sql: `
            SELECT id, username, realname, phone, email, role, manufacturer_id, status, created_at
            FROM users
            WHERE id = LAST_INSERT_ID()
          `,
          params: []
        }
      ];

      const results = await executeTransaction(transactionQueries) as [UpsertResult, UserRow[]];
      const [insertResult, selectResults] = results;

      if (!insertResult.insertId || selectResults.length === 0) {
        throw new Error('Failed to create user in transaction');
      }

      // 直接使用映射函数，返回UserWithoutPassword
      return mapRowToUserWithoutPassword(selectResults[0]);
    } catch (error) {
      console.error('Register service error:', error);
      throw new Error(`Failed to create user: ${(error as Error).message}`);
    }
  },

  /**
   * 用户登录
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    // 查找用户
    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new Error('不存在该账户');
    }

    // 检查用户状态
    if (user.status !== Status.ACTIVE) {
      throw new Error('Account is not active');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 更新最后登录时间
    await UserModel.updateLastLogin(user.id);

    // 生成JWT令牌
    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      token
    };
  },

  /**
   * 检查用户名是否已存在
   */
  async isUsernameExists(username: string): Promise<boolean> {
    const user = await UserModel.findByUsername(username);
    return !!user;
  },

  /**
   * 更新用户信息
   * @param userId 目标用户ID
   * @param updateData 要更新的数据（部分字段）
   * @returns 更新后的用户信息
   */
  async updateUser(userId: number, updateData: Partial<Omit<User, 'id' | 'created_at' | 'username'>>): Promise<UserWithoutPassword | null> {
    // 1. 验证目标用户是否存在
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // 2. 处理密码加密（如果更新密码）
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // 3. 角色更新的特殊处理（仅超级管理员可执行）
    if (updateData.role) {
      // 验证角色合法性（这里假设权限检查已在控制器完成）
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(updateData.role)) {
        throw new Error('Invalid user role');
      }

      // 若更新为厂商管理员，必须关联厂商ID
      if (updateData.role === UserRole.MANUFACTURER_ADMIN && !updateData.manufacturer_id) {
        throw new Error('Manufacturer ID is required for manufacturer admin');
      }

      // 若更新为非厂商管理员，清除厂商ID关联
      if (updateData.role !== UserRole.MANUFACTURER_ADMIN && updateData.role !== UserRole.STAFF) {
        updateData.manufacturer_id = null;
      }
    }

    // 4. 执行数据库更新（调用模型层）
    return UserModel.update(userId, updateData);
  }
};

export default authService;
