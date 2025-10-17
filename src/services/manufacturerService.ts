// src/services/manufacturerService.ts
import ManufacturerModel from '../models/Manufacturer';
import UserModel from '../models/User';
import { Manufacturer, Status, CreateManufacturerRequest, ManufacturerWithSchools } from '../types';

const manufacturerService = {
  /**
   * 创建厂商（仅超级管理员可用）
   */
  async createManufacturer(data: CreateManufacturerRequest): Promise<Manufacturer> {
    // 检查厂商名称是否已存在

    const allManufacturers = await ManufacturerModel.findAll();

    // 若allManufacturers不是数组，会导致some调用失败
    const nameExists = Array.isArray(allManufacturers)
      ? allManufacturers.some(m => m.name === data.name)
      : false;

    if (nameExists) {
      throw new Error('厂商已存在！');
    }

    // 创建厂商
    return ManufacturerModel.create({
      ...data,
      status: data.status || Status.ACTIVE
    });
  },

  /**
   * 获取厂商详情
   */
  async getManufacturerById(id: number): Promise<Manufacturer | null> {
    return ManufacturerModel.findById(id);
  },

  /**
   * 获取所有厂商列表
   */
  async getAllManufacturers(): Promise<Manufacturer[]> {
    return ManufacturerModel.findAll();
  },
  /**
   * 获取所有厂商列表带学校
   */
  async getAllManufacturersWithSchools(): Promise<ManufacturerWithSchools[]> {
    return ManufacturerModel.findAllWithSchools();
  },
  /**
   * 删除厂商（仅超级管理员可用）
   * 业务逻辑：
   * 1. 检查厂商是否存在
   * 2. 检查该厂商下是否有关联用户（管理员/职员）
   * 3. 若有关联用户，不允许删除（避免数据孤立）
   * 4. 若没有关联用户，执行删除
   */
  async deleteManufacturer(manufacturerId: number): Promise<void> {
    // 1. 检查厂商是否存在
    const manufacturer = await ManufacturerModel.findById(manufacturerId);
    if (!manufacturer) {
      throw new Error('Manufacturer not found');
    }

    // 2. 检查该厂商是否有关联用户（厂商管理员或职员）
    const associatedUsers = await UserModel.findByManufacturerId(manufacturerId);
    if (associatedUsers.length > 0) {
      // 提取关联用户的用户名，便于前端提示
      const usernames = associatedUsers.map(u => u.username).join(', ');
      throw new Error(`Cannot delete manufacturer: associated users exist (${usernames})`);
    }

    // 3. 执行删除操作
    const deleteResult = await ManufacturerModel.delete(manufacturerId);
    if (!deleteResult) {
      throw new Error('Failed to delete manufacturer from database');
    }
  },
  /**
   * 按条件搜索厂商
   * @param params 搜索参数（name: 模糊匹配, status: 精确匹配）
   */
  async searchManufacturers(params: {
    name?: string;
    status?: Status;
  }): Promise<Manufacturer[]> {
    return ManufacturerModel.findByConditions(params);
  },
  /**
 * 更新厂商信息（仅超级管理员可用）
 */
  async updateManufacturer(
    id: number,
    updateData: Manufacturer
  ): Promise<Manufacturer | null> {
    // 检查名称是否重复（如果更新了名称）
    if (updateData.name) {
      const allManufacturers = await ManufacturerModel.findAll();
      const nameExists = Array.isArray(allManufacturers) &&
        allManufacturers.some(m => m.name === updateData.name && m.id !== id);

      if (nameExists) {
        throw new Error('厂商名称已存在');
      }
    }

    return ManufacturerModel.update(id, updateData);
  }
};

export default manufacturerService;
