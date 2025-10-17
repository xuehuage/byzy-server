import SchoolModel from '../models/School';
import { Status, User } from '../types';
import { School, CreateSchoolDto, UpdateSchoolDto } from '../types/school.types';
import { JwtPayload, ManufacturerIdType } from '../utils/jwt';

const schoolService = {
  /**
   * 创建学校（含初始年级信息）
   */
  async createSchool(data: CreateSchoolDto & { manufacturer_id: ManufacturerIdType }): Promise<School> {
    // 补充默认值：状态默认为启用
    const schoolData = {
      ...data,
      status: data.status || 1,
      grades: data.grades || [] // 允许空数组（后续编辑添加）
    };

    return SchoolModel.create(schoolData);
  },

  /**
   * 根据厂商ID查询所有学校
   */
  async getSchoolsByManufacturerId(manufacturerId: ManufacturerIdType): Promise<School[]> {
    if (!manufacturerId) {
      throw new Error('getSchoolsByManufacturerId manufacturerId is undefined!');
    }
    return SchoolModel.findByManufacturerId(manufacturerId);
  },

  /**
   * 获取单个学校（带权限验证）
   */
  async getSchoolById(schoolId: number, user: JwtPayload): Promise<School | null> {
    return SchoolModel.findByIdAndManufacturer(schoolId, user);
  },

  /**
   * 更新学校
   */
  async updateSchool(schoolId: number, updateData: UpdateSchoolDto, user: JwtPayload): Promise<School | null> {
    // 先验证归属
    const school = await SchoolModel.findByIdAndManufacturer(schoolId, user);
    if (!school) return null;

    return SchoolModel.update(schoolId, updateData);
  },



  /**
 * 按条件查询学校（支持多参数组合）
 * @param params 查询参数（manufacturer_id、name、status 均为可选）
 * @returns 符合条件的学校数组
 */
  async getSchoolsByConditions(params: {
    manufacturer_id?: number;
    name?: string;
    status?: Status;
  }): Promise<School[]> {
    // 调用模型层的条件查询方法
    return SchoolModel.findByConditions(params);
  }
};

export default schoolService;
