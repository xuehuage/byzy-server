// src/services/userService.ts
import UserModel from '../models/User';
import { User, UserRole, Status,UserWithoutPassword } from '../types';
import bcrypt from 'bcryptjs';
import { generateToken, ManufacturerIdType } from '../utils/jwt';

const userService = {
  /**
   * 用户注册（调用模型创建用户，包含业务验证）
   */
  async register(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login_at'>): Promise<UserWithoutPassword> {
    // 验证用户名是否已存在
    const existingUser = await UserModel.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // 验证厂商管理员是否关联厂商
    if (userData.role === UserRole.MANUFACTURER_ADMIN && !userData.manufacturer_id) {
      throw new Error('Manufacturer ID is required for manufacturer admin');
    }

    // 调用模型创建用户
    return UserModel.create(userData);
  },

  /**
   * 用户登录（验证密码并返回用户信息）
   */
  async login(username: string, password: string): Promise<{ user: UserWithoutPassword; token: string }> {
    // 查找用户
    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // 验证用户状态（是否激活）
    if (user.status !== Status.ACTIVE) {
      throw new Error('Account is inactive');
    }

    // 更新最后登录时间
    await UserModel.updateLastLogin(user.id);

    // 返回用户信息（不含密码）和生成的令牌
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: generateToken(userWithoutPassword) // 调用JWT工具生成令牌
    };
  },

  /**
   * 根据ID查询用户
   */
  async getUserById(id: number): Promise<UserWithoutPassword | null> {
    return UserModel.findById(id);
  },

  /**
   * 根据厂商ID查询用户（厂商管理员和职员）
   */
  async getUsersByManufacturerId(manufacturerId: number): Promise<User[]> {
    return UserModel.findByManufacturerId(manufacturerId);
  },

  /**
   * 更新用户信息（含权限验证）
   */
  async updateUser(id: number, updateData: Partial<Omit<User, 'id' | 'created_at'>>): Promise<UserWithoutPassword | null> {
    // 禁止直接更新角色（角色调整有单独逻辑）
    if (updateData.role) {
      throw new Error('Role cannot be updated directly');
    }

    // 禁止更新用户名（用户名唯一且不可修改）
    if (updateData.username) {
      throw new Error('Username cannot be changed');
    }

    return UserModel.update(id, updateData);
  },

  /**
   * 删除用户
   */
  /**
   * 删除用户（合并重复方法，保留权限校验逻辑）
   */
  async deleteUser(id: number): Promise<boolean> {
    // 防止删除超级管理员（保留原有权限校验）
    const user = await UserModel.findById(id);
    if (user && user.role === UserRole.SUPER_ADMIN) {
      throw new Error('Cannot delete super admin');
    }

    // 调用模型层删除方法（而非直接写SQL）
    return UserModel.delete(id);
  },

  /**
   * 调整用户角色（仅超管可用）
   */
  async changeUserRole(userId: number, newRole: UserRole, manufacturerId?: number): Promise<UserWithoutPassword | null> {
    // 验证新角色是否合法
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid user role');
    }

    // 若调整为厂商管理员，必须指定厂商ID
    if (newRole === UserRole.MANUFACTURER_ADMIN && !manufacturerId) {
      throw new Error('Manufacturer ID is required for manufacturer admin');
    }

    // 执行更新（角色+可能的厂商ID）
    return UserModel.update(userId, {
      role: newRole,
      manufacturer_id: newRole === UserRole.MANUFACTURER_ADMIN ? manufacturerId : null
    });
  },
  
};

export default userService;
