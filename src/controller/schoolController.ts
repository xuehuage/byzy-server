import { Request, Response } from 'express';
import schoolService from '../services/schoolService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const schoolController = {
  /**
   * 创建学校
   */
  createSchool: async (req: Request, res: Response) => {
    try {
      const currentUser = req.user;
      const schoolData = req.body;
      let manufacturerId;

      // 区分用户角色处理厂商ID
      if (currentUser?.role === 'super_admin') {
        // 超级管理员场景：必须从请求体获取厂商ID
        if (schoolData.manufacturer_id === undefined || schoolData.manufacturer_id === null) {
          return sendError(res, '超级管理员创建学校必须指定manufacturer_id', 400);
        }
        manufacturerId = schoolData.manufacturer_id;
      } else {
        // 厂商用户场景：从当前用户获取厂商ID
        if (currentUser?.manufacturerId === undefined || currentUser.manufacturerId === null) {
          return sendError(res, '厂商用户未关联厂商信息', 403);
        }
        manufacturerId = currentUser.manufacturerId;
      }

      // 创建学校（合并厂商ID和学校数据）
      const school = await schoolService.createSchool({
        ...schoolData,
        manufacturer_id: manufacturerId
      });
      return sendSuccess(res, school, '学校创建成功');
    } catch (error) {
      console.error('创建学校失败:', error);
      return sendError(res, `创建学校失败: ${(error as Error).message}`, 500);
    }

  },

  /**
   * 获取厂商的所有学校
   */
  getManufacturerSchools: async (req: Request, res: Response) => {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        return sendError(res, '当前用户未登录', 403);
      }
      let id = currentUser?.manufacturerId
      if (currentUser?.role === 'super_admin') {
        id = Number(req.query.id)
      }
      const schools = await schoolService.getSchoolsByManufacturerId(id);
      return sendSuccess(res, {
        count: schools.length,
        schools
      }, '学校列表获取成功');
    } catch (error) {
      console.error('获取学校列表失败:', error);
      return sendError(res, '获取学校列表失败', 500);
    }
  },
  /**
   * 获取厂商管理的所有学校（含年级和班级信息）
   */
  getSchoolsWithRelations: async (req: Request, res: Response) => {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        return sendError(res, '当前用户未登录', 403);
      }

      // 确定厂商ID（复用现有权限逻辑）
      let manufacturerId: number;
      if (currentUser.role === 'super_admin') {
        const queryId = Number(req.query.manufacturer_id);
        if (isNaN(queryId)) {
          return sendError(res, '参数id必须为数字', 400);
        }
        manufacturerId = queryId;
      } else {
        if (!currentUser.manufacturerId) {
          return sendError(res, '厂商用户未关联厂商信息', 403);
        }
        manufacturerId = currentUser.manufacturerId;
      }

      // 调用服务层获取带关联的数据
      const schools = await schoolService.getSchoolsWithRelations(manufacturerId);

      return sendSuccess(res, {
        count: schools.length,
        schools
      }, '学校及关联信息获取成功');
    } catch (error) {
      console.error('获取学校及关联信息失败:', error);
      return sendError(res, '获取学校及关联信息失败', 500);
    }
  },

  /**
   * 获取单个学校详情
   */
  getSchoolById: async (req: Request, res: Response) => {
    try {
      const { schoolId } = req.params;
      if (!req.user) {
        return sendError(res, '请重新登录', 403);
      }
      const school = await schoolService.getSchoolById(Number(schoolId), req.user);
      if (!school) {
        return sendError(res, '学校不存在或不属于当前厂商', 404);
      }

      return sendSuccess(res, school, '学校详情获取成功');
    } catch (error) {
      console.error('获取学校详情失败:', error);
      return sendError(res, '获取学校详情失败', 500);
    }
  },

  /**
   * 更新学校信息
   */
  updateSchool: async (req: Request, res: Response) => {
    try {
      const { schoolId } = req.params;
      const { created_at, updated_at, ...updateData } = req.body;
      const updatedSchool = await schoolService.updateSchool(
        Number(schoolId),
        updateData,
        updateData.manufacturer_id
      );

      if (!updatedSchool) {
        return sendError(res, '更新学校失败:学校不存在或不属于当前厂商', 404);
      }

      return sendSuccess(res, updatedSchool, '学校更新成功');
    } catch (error) {
      console.error('更新学校失败:', error);
      return sendError(res, `更新学校失败: ${(error as Error).message}`, 500);
    }
  },

  /**
 * 按条件查询学校列表（支持manufacturer_id、name模糊搜索、status筛选）
 */
  getSchoolsByConditions: async (req: Request, res: Response) => {
    try {
      const { manufacturer_id, name, status } = req.query;

      // 处理参数类型转换
      const queryParams = {
        // 厂商ID：前端传参或厂商用户关联的ID（超管可查全部）
        manufacturer_id: Number(manufacturer_id),
        name: name as string, // 模糊搜索关键词
        status: status !== undefined ? Number(status) : status // 状态（转换为数字）
      };

      // 调用服务层查询
      const schools = await schoolService.getSchoolsByConditions(queryParams);
      sendSuccess(res, { schools }, '学校列表查询成功');
    } catch (error) {
      console.error('查询学校失败:', error);
      sendError(res, `查询失败: ${(error as Error).message}`, 500);
    }
  }
};

export default schoolController;
