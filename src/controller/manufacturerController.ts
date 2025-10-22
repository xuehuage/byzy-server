// src/controllers/manufacturerController.ts
import { Request, Response } from 'express';
import { body } from 'express-validator';
import { sendSuccess, sendError } from '../utils/apiResponse';
import manufacturerService from '../services/manufacturerService';
import { UserRole, Status } from '../types';
import { validateRequest } from '../middleware/validateRequest';

// 厂商创建验证规则
export const createManufacturerValidation = [
  body('name').notEmpty().withMessage('已有同名厂商'),
  body('contact_person').notEmpty().withMessage('联系人必填'),
  body('status').optional().isIn([Status.ACTIVE, Status.INACTIVE]).withMessage('无效的状态')
];

const manufacturerController = {
  /**
   * 创建厂商（仅超级管理员）
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // 验证权限（仅超级管理员可创建厂商）
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        sendError(res, '无操作权限！', 403);
        return;
      }

      const manufacturerData = req.body;
      const newManufacturer = await manufacturerService.createManufacturer(manufacturerData);
      sendSuccess(res, { manufacturer: newManufacturer }, '创建成功');
    } catch (error) {
      console.error('创建失败:', error);
      sendError(res, (error as Error).message || 'Failed to create manufacturer');
    }
  },

  /**
   * 删除厂商（仅超管）
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const manufacturerId = Number(id);

      // 检查厂商是否存在
      const existing = await manufacturerService.getManufacturerById(manufacturerId);
      if (!existing) {
        sendError(res, 'Manufacturer not found', 404);
        return;
      }

      // 执行删除（需在service和model中实现delete方法）
      await manufacturerService.deleteManufacturer(manufacturerId);
      sendSuccess(res, null, 'Manufacturer deleted successfully');
    } catch (error) {
      console.error('Error deleting manufacturer:', error);
      sendError(res, 'Failed to delete manufacturer');
    }
  },

  // 查询厂商列表（仅超管，由路由的requireSuperAdmin保证）
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const manufacturers = await manufacturerService.getAllManufacturers();
      sendSuccess(res, { manufacturers }, '厂商列表查询成功');
    } catch (error) {
      console.error('Error getting manufacturers:', error);
      sendError(res, 'Failed to get manufacturers');
    }
  },
  /**
   * 查询厂商列表带学校信息
   * @param req 
   * @param res 
   */
  async getAllWithSchools(req: Request, res: Response): Promise<void> {
    try {
      const manufacturers = await manufacturerService.getAllManufacturersWithSchools();
      sendSuccess(res, { manufacturers }, '查询成功');
    } catch (error) {
      console.error('Error getting manufacturers:', error);
      sendError(res, 'Failed to get manufacturers');
    }
  },
  /**
  * 按条件查询厂商列表（支持名称模糊搜索和状态筛选）
  * 支持单个条件或组合条件查询
  */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const manufacturers = await manufacturerService.searchManufacturers(req.query);
      sendSuccess(res, { manufacturers }, '查询成功');
    } catch (error) {
      console.error('查询厂商失败:', error);
      sendError(res, 'Failed to search manufacturers');
    }
  },


  // 查询单个厂商（超管可查所有，厂商用户仅可查自己关联的）
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const targetId = Number(id);
      const user = req.user!;

      // 超管：无限制
      if (user.role === UserRole.SUPER_ADMIN) {
        const manufacturer = await manufacturerService.getManufacturerById(targetId);
        if (!manufacturer) {
          sendError(res, 'Manufacturer not found', 404);
          return;
        }
        sendSuccess(res, { manufacturer }, 'Manufacturer retrieved successfully');
        return;
      }

      // 厂商用户（管理员/职员）：只能查自己关联的厂商
      if (
        user.role === UserRole.MANUFACTURER_ADMIN ||
        user.role === UserRole.STAFF
      ) {
        // 验证用户是否关联厂商
        if (user.manufacturerId === null) {
          sendError(res, 'No associated manufacturer', 403);
          return;
        }

        // 验证目标厂商是否是自己关联的
        if (user.manufacturerId !== targetId) {
          sendError(res, 'Access denied: can only view associated manufacturer', 403);
          return;
        }

        const manufacturer = await manufacturerService.getManufacturerById(targetId);
        if (!manufacturer) {
          sendError(res, 'Manufacturer not found', 404);
          return;
        }
        sendSuccess(res, { manufacturer }, 'Manufacturer retrieved successfully');
        return;
      }

      // 其他角色：无权限
      sendError(res, 'Access denied', 403);
    } catch (error) {
      console.error('Error getting manufacturer:', error);
      sendError(res, 'Failed to get manufacturer');
    }
  },
  /**
 * 更新厂商信息（仅超级管理员）
 */
  async update(req: Request, res: Response): Promise<void> {
    try {
      // 权限验证
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        sendError(res, '无操作权限', 403);
        return;
      }

      const { id } = req.params;
      const manufacturerId = Number(id);
      const updateData = req.body;

      // 执行更新
      const updatedManufacturer = await manufacturerService.updateManufacturer(manufacturerId, updateData);
      if (!updatedManufacturer) {
        sendError(res, '厂商不存在', 404);
        return;
      }

      sendSuccess(res, { manufacturer: updatedManufacturer }, '更新成功');
    } catch (error) {
      console.error('更新厂商失败:', error);
      sendError(res, (error as Error).message || '更新厂商失败');
    }
  }
};

export default manufacturerController;
