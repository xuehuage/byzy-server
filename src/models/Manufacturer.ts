// src/models/Manufacturer.ts
import { RowDataPacket, ResultSetHeader, OkPacket } from 'mysql2';
import { executeQuery } from '../config/database';
import { CreateManufacturerRequest, Manufacturer, ManufacturerWithSchools, Status } from '../types';
import SchoolModel from './School';

// 定义厂商行数据类型
interface ManufacturerRow extends Manufacturer, RowDataPacket { }

type UpdateManufacturerRequest = Omit<Manufacturer, 'created_at' | 'updated_at'>

const ManufacturerModel = {
  /**
   * 创建新厂商
   */
  async create(manufacturerData: CreateManufacturerRequest): Promise<Manufacturer> {
    const query = `
      INSERT INTO manufacturers 
        (name, contact_person, contact_phone, status)
      VALUES (?, ?, ?, ?)
    `;

    const params = [
      manufacturerData.name,
      manufacturerData.contact_person,
      manufacturerData.contact_phone,
      manufacturerData.status || Status.ACTIVE
    ];

    try {
      // 执行INSERT，获取结果（ResultSetHeader包含insertId）
      const result = await executeQuery<ResultSetHeader>(query, params);
      const insertId = result.insertId;

      // 查询新创建的厂商
      const newManufacturer = await this.findById(insertId);
      if (!newManufacturer) {
        throw new Error('Failed to retrieve new manufacturer (可能ID无效)');
      }

      return newManufacturer;
    } catch (error) {
      console.error('创建厂商失败:', error);
      throw new Error('Failed to create manufacturer');
    }
  },

  /**
   * 通过ID查询厂商
   */
  async findById(id: number): Promise<Manufacturer | null> {
    const query = 'SELECT * FROM manufacturers WHERE id = ?';

    try {
      // 执行查询，返回的是rows数组（ManufacturerRow[]）
      const rows = await executeQuery<ManufacturerRow[]>(query, [id]);

      // rows是数组，取第一个元素（若存在）
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`查询厂商ID=${id}失败:`, error);
      throw new Error('Failed to find manufacturer');
    }
  },



  /**
   * 查询所有厂商
   */
  async findAll(): Promise<Manufacturer[]> {
    const query = 'SELECT * FROM manufacturers';

    try {
      const rows = await executeQuery<ManufacturerRow[]>(query);
      return rows; // 直接返回rows数组（本身是可迭代的）
    } catch (error) {
      console.error('查询所有厂商失败:', error);
      throw new Error('Failed to find all manufacturers');
    }
  },



  /**
  * 查询所有厂商（包含关联的学校信息）
  */
  async findAllWithSchools(): Promise<ManufacturerWithSchools[]> {
    const query = 'SELECT * FROM manufacturers';

    try {
      const rows = await executeQuery<ManufacturerRow[]>(query);

      const manufacturersWithSchools = await Promise.all(
        rows.map(async (manufacturer) => {
          const schools = await SchoolModel.findByManufacturerId(manufacturer.id);
          return {
            ...manufacturer,
            schools
          };
        })
      );

      return manufacturersWithSchools;
    } catch (error) {
      console.error('查询所有厂商失败:', error);
      throw new Error('Failed to find all manufacturers');
    }
  },

  /**
 * 更新厂商信息（仅允许更新指定字段）
 * @param id 厂商ID
 * @param updateData 要更新的字段（仅支持 status, name, contact_person, contact_phone）
 * @returns 更新 */
  async update(
    id: number,
    updateData: Manufacturer
  ): Promise<Manufacturer | null> {
    // 1. 验证厂商是否存在
    const existingManufacturer = await this.findById(id);
    if (!existingManufacturer) {
      throw new Error('Manufacturer not found');
    }


    const filteredData: UpdateManufacturerRequest = {
      name: updateData.name,
      id: updateData.id,
      status: updateData.status,
      contact_person: updateData.contact_person,
      contact_phone: updateData.contact_phone
    };


    // 5. 构建动态更新SQL和参数
    const updateFields = Object.keys(filteredData).map(key => `${key} = ?`);
    const sql = `
    UPDATE manufacturers
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = ?
  `;

    const params = [
      ...Object.values(filteredData), // 过滤后的字段值
      id // WHERE条件的厂商ID
    ];

    try {
      // 执行更新并
      await executeQuery<OkPacket>(sql, params);
      // 返回更新更新后的完整信息
      return this.findById(id);
    } catch (error) {
      console.error('Error updating manufacturer:', error);
      throw new Error('Failed to update manufacturer');
    }
  },
  /**
   * 从数据库中删除厂商
   */
  async delete(manufacturerId: number): Promise<boolean> {
    const query = 'DELETE FROM manufacturers WHERE id = ?';

    try {
      const result = await executeQuery<OkPacket>(query, [manufacturerId]);
      // affectedRows 为1表示删除成功
      return result.affectedRows === 1;
    } catch (error) {
      console.error('Error deleting manufacturer from database:', error);
      throw new Error('Database error while deleting manufacturer');
    }
  },
  /**
  * 按条件查询厂商（支持名称模糊搜索和状态筛选）
  */
  async findByConditions(params: {
    name?: string;
    status?: Status;
  }): Promise<Manufacturer[]> {
    // 基础SQL
    let query = 'SELECT * FROM manufacturers WHERE 1=1';
    const queryParams: any[] = [];

    // 处理名称模糊搜索
    if (params.name) {
      query += ' AND name LIKE ?';
      queryParams.push(`%${params.name}%`); // 前后加%实现模糊匹配
    }

    // 处理状态筛选
    if (params.status !== undefined) {
      query += ' AND status = ?';
      queryParams.push(params.status);
    }

    // 按创建时间排序
    query += ' ORDER BY created_at DESC';

    try {
      const rows = await executeQuery<ManufacturerRow[]>(query, queryParams);
      if (rows.length === 0) return rows
      const manufacturersWithSchools = await Promise.all(
        rows.map(async (manufacturer) => {
          const schools = await SchoolModel.findByManufacturerId(manufacturer.id);
          return {
            ...manufacturer,
            schools
          };
        })
      );
      return manufacturersWithSchools;
    } catch (error) {
      console.error('按条件查询厂商失败:', error);
      throw new Error('Failed to find manufacturers by conditions');
    }
  }
};



export default ManufacturerModel;
