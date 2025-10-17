// src/controllers/manufacturerUserController.ts
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import userService from '../services/userService';
import { UserRole } from '../types';

const manufacturerUserController = {
  /**
   * 查询本厂商的所有用户（厂商管理员/职员）
   * 权限：仅本厂商的管理员和职员可访问
   */
  async getManufacturerUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      let manufacturerId = currentUser.manufacturerId;

      if (currentUser.role === 'super_admin') {
        manufacturerId = Number(req.query.id);
      }

      if (!manufacturerId) {
        sendError(res, '没有关联厂商', 403);
        return;
      }

      // 查询本厂商的所有用户（管理员+职员）
      const users = await userService.getUsersByManufacturerId(manufacturerId);
      sendSuccess(res, { users }, 'Manufacturer users retrieved successfully');
    } catch (error) {
      console.error('Error getting manufacturer users:', error);
      sendError(res, 'Failed to retrieve manufacturer users');
    }
  },

  /**
   * 查询本厂商的单个用户详情
   * 权限：仅本厂商的管理员和职员可访问
   */
  async getManufacturerUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const targetUserId = Number(id);
      const currentUser = req.user!;
      const manufacturerId = currentUser.manufacturerId;
      // 验证用户是否关联厂商
      if (manufacturerId === null) {
        sendError(res, 'No associated manufacturer found', 403);
        return;
      }

      // 查询目标用户
      const user = await userService.getUserById(targetUserId);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      // 验证目标用户是否属于本厂商
      if (user.manufacturer_id !== manufacturerId) {
        sendError(res, 'Access denied: user does not belong to your manufacturer', 403);
        return;
      }

      sendSuccess(res, { user }, 'Manufacturer user retrieved successfully');
    } catch (error) {
      console.error('Error getting manufacturer user:', error);
      sendError(res, 'Failed to retrieve manufacturer user');
    }
  },

  /**
   * 删除本厂商的职员（仅厂商管理员可操作）
   */
  async deleteManufacturerStaff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const targetUserId = Number(id);
      const currentUser = req.user!;
      const manufacturerId = currentUser.manufacturerId;

      // 验证当前用户是否为厂商管理员
      if (currentUser.role !== UserRole.MANUFACTURER_ADMIN) {
        sendError(res, 'Access denied: only manufacturer admin can delete staff', 403);
        return;
      }

      // 验证用户是否关联厂商
      if (manufacturerId === null) {
        sendError(res, 'No associated manufacturer found', 403);
        return;
      }

      // 查询目标用户
      const user = await userService.getUserById(targetUserId);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      // 验证目标用户是否属于本厂商
      if (user.manufacturer_id !== manufacturerId) {
        sendError(res, 'Access denied: user does not belong to your manufacturer', 403);
        return;
      }

      // 禁止删除厂商管理员（只能删除职员）
      if (user.role === UserRole.MANUFACTURER_ADMIN) {
        sendError(res, 'Cannot delete manufacturer admin', 403);
        return;
      }

      // 执行删除
      const isDeleted = await userService.deleteUser(targetUserId);
      if (!isDeleted) {
        sendError(res, 'Failed to delete user', 500);
        return;
      }

      sendSuccess(res, null, 'Staff user deleted successfully');
    } catch (error) {
      console.error('Error deleting manufacturer staff:', error);
      sendError(res, (error as Error).message || 'Failed to delete staff user');
    }
  }
};

export default manufacturerUserController;
