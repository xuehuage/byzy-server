import { executeQuery, executeTransaction } from '../config/database';
import { Status, User } from '../types';
import { Grade } from '../types/gradeClass.types';
import { School, CreateSchoolDto, UpdateSchoolDto } from '../types/school.types';
import { JwtPayload, ManufacturerIdType } from '../utils/jwt';
import ClassModel from './Class';
import GradeModel from './Grade'; // 关联年级模型



/**
 * 学校模型类（与数据库表schools对应）
 */
class SchoolModel {

  /**
 * 获取公开的学校详情（仅包含非敏感信息）
 */
  static async findPublicSchoolDetail(schoolId: number): Promise<School | null> {
    const sql = `
     SELECT id, name, created_at, updated_at
      FROM schools
      WHERE id = ?
  `;

    const rows = await executeQuery<School>(sql, [schoolId]);
    if (rows.length === 0) return null;

    const school = rows[0];

    return school;
  }

  /**
   * 创建学校（包含年级信息）
   * @param schoolData 学校信息（含可选的年级数组）
   * @returns 创建的学校记录（含年级）
   */
  static async create(schoolData: CreateSchoolDto & { manufacturer_id?: ManufacturerIdType }): Promise<School> {
    // 使用事务确保数据一致性
    const [schoolResult] = await executeTransaction([
      {
        sql: `
        INSERT INTO schools (
          name, type, education_years, status, 
          manufacturer_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
        params: [
          schoolData.name,
          schoolData.type,
          schoolData.education_years,
          schoolData.status || 1,
          schoolData.manufacturer_id || null // 支持超级管理员指定厂商
        ]
      }
    ]);

    const schoolId = (schoolResult as { insertId: number }).insertId;

    // // 处理年级和班级数据
    // if (schoolData.grades && schoolData.grades.length > 0) {
    //   // 1. 对grade字段去重并分组
    //   const gradeGroups = schoolData.grades.reduce((groups, item) => {
    //     const key = item.grades;
    //     if (!groups[key]) {
    //       groups[key] = [];
    //     }
    //     groups[key].push(item.classes);
    //     return groups;
    //   }, {} as Record<string, string[]>);

    //   // 2. 遍历分组结果，创建年级和对应班级
    //   for (const [gradeValue, classNames] of Object.entries(gradeGroups)) {
    //     // 2.1 创建年级（使用grade值作为名称，level可根据需要转换）
    //     const grade = await GradeModel.create({
    //       name: gradeValue, // 年级名称格式化
    //       school_id: schoolId,
    //       classes: [] // 先空数组，后续单独创建班级
    //     });

    //     // 2.2 批量创建班级
    //     await ClassModel.bulkCreate(
    //       classNames.map((className, index) => ({
    //         name: className,
    //         class_order: index + 1, // 班级序号从1开始
    //         grade_id: grade.id,
    //         school_id: schoolId // 冗余存储学校ID，优化查询
    //       }))
    //     );
    //   }
    // }

    const newSchool = await this.findById(schoolId);
    if (!newSchool) {
      throw new Error('创建失败，没有找到学校信息');
    }
    return newSchool;
  }
  /**
   * 根据厂商ID查询所有学校
   * @param manufacturerId 厂商ID
   * @returns 学校数组（
   */
  static async findByManufacturerId(manufacturerId: ManufacturerIdType): Promise<School[]> {
    const sql = `
      SELECT id, name,manufacturer_id, status
      FROM schools
      WHERE manufacturer_id = ?
      ORDER BY created_at DESC
    `;
    // 修复：查询结果需要手动初始化 grades 字段
    const schools = (await executeQuery<Omit<School, 'grades'>>(sql, [manufacturerId])).map(school => ({
      ...school,
      grades: [] as Grade[] // 初始化空数组
    }));

    for (const school of schools) {
      school.grades = await GradeModel.findBySchoolId(school.id);
    }

    return schools;
  }

  /**
   * 根据厂商ID查询所有学校
   * @param manufacturerId 厂商ID
   * @returns 学校数组（每个学校含年级列表）
   */
  static async findSchoolsWithRelations(manufacturerId: number): Promise<School[]> {

    const schools = await this.findByManufacturerId(manufacturerId)

    // 2. 为每个学校查询年级和班级
    return Promise.all(schools.map(async (school) => {
      // 2.1 查询学校所有年级（含班级）
      const grades = await GradeModel.findBySchoolId(school.id);

      // 2.2 提取所有班级并补充gradeId
      const classes = grades.flatMap(grade =>
        grade.classes?.map(cls => ({
          ...cls,
          gradeId: grade.id // 补充班级所属年级ID
        })) || []
      );

      return {
        ...school,
        grades, // 仅保留需要的字段
        classes // 匹配目标格式
      };
    }));
  }

  /**
   * 根据学校ID查询单个学校（含年级）
   * @param id 学校ID
   * @returns 学校详情
   */
  static async findById(id: ManufacturerIdType): Promise<School | null> {
    const sql = `
      SELECT id, name, manufacturer_id, status, created_at, updated_at
      FROM schools
      WHERE id = ?
    `;
    const rows = await executeQuery<School>(sql, [id]);
    if (rows.length === 0) return null;

    const school: School = rows[0]
    // 查询关联的年级
    // school.grades = await GradeModel.findBySchoolId(school.id);

    return school;
  }

  /**
   * 验证学校是否属于某个厂商
   * @param schoolId 学校ID
   * @param manufacturerId 厂商ID
   * @returns 存在且属于该厂商则返回学校信息，否则返回null
   */
  static async findByIdAndManufacturer(schoolId: number, user: JwtPayload): Promise<School | null> {
    let sql = `
      SELECT id, name,type, manufacturer_id, status, created_at, updated_at
      FROM schools
      WHERE id = ? 
    `;
    let params = [schoolId]
    if (user.role !== 'super_admin') {
      sql += 'AND manufacturer_id = ?';
      if (user.manufacturerId) {
        params = [schoolId, user?.manufacturerId]
      }
    }

    const rows = await executeQuery<School>(sql, params);
    if (rows.length === 0) return null;

    const school = rows[0];
    // school.grades = await GradeModel.findBySchoolId(school.id);

    return school;
  }

  /**
   * 更新学校信息（含年级）
   * @param id 学校ID
   * @param updateData 要更新的数据（含可选的年级数组）
   * @returns 更新后的学校信息
   */
  static async update(id: number, updateData: UpdateSchoolDto): Promise<School | null> {
    // 提取学校基本信息（排除grades）
    const { grades, ...schoolFields } = updateData;

    // 构建动态更新SQL
    const updateFields = Object.entries(schoolFields)
      .filter(([_, value]) => value !== undefined)
      .map(([key]) => `${key} = ?`);

    if (updateFields.length > 0) {
      const sql = `
        UPDATE schools
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `;

      const params = [
        ...Object.entries(schoolFields)
          .filter(([_, value]) => value !== undefined)
          .map(([_, value]) => value),
        id
      ];

      await executeQuery(sql, params);
    }

    // if (grades !== undefined) {
    //   // 遍历年级列表，处理每个年级的更新或创建
    //   const gradeOperations = grades.map(async (grade) => {
    //     // 1. 如果年级有ID，说明是更新现有年级
    //     if (grade.id) {
    //       return GradeModel.update(grade.id, grade);
    //     }
    //     // 2. 无ID则是新增年级
    //     else {
    //       return GradeModel.create({
    //         ...grade,
    //         school_id: id // 关联当前学校
    //       });
    //     }
    //   });

    //   // 等待所有年级操作完成
    //   await Promise.all(gradeOperations);
    // }

    return this.findById(id);
  }

  /**
   * 更新学校状态（启用/禁用）
   * @param id 学校ID
   * @param status 新状态
   * @returns 更新后的学校信息
   */
  static async updateStatus(id: ManufacturerIdType, status: Status): Promise<School | null> {
    const sql = `
      UPDATE schools
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    await executeQuery(sql, [status, id]);
    return this.findById(id);
  }



  /**
   * 新增：查询所有学校（含学制年限和年级信息，用于自动升级）
   */
  // static async findAll(): Promise<(School & { education_years: number })[]> {
  //   // 仅处理启用状态的学校
  //   const sql = `
  //     SELECT id, name, manufacturer_id, status, education_years, created_at, updated_at
  //     FROM schools
  //     WHERE status = 1  
  //   `;
  //   // 查询结果包含 education_years（学制年限），用于判断年级升级上限
  //   const schoolRows = await executeQuery<(Omit<School, 'grades'> & { education_years: number })[]>(sql);

  //   // 为每个学校关联年级信息
  //   const schoolsWithGrades = await Promise.all(
  //     schoolRows.map(async (school) => {
  //       const grades = await GradeModel.findBySchoolId(school.id);
  //       return {
  //         ...school,
  //         grades: grades as Grade[], // 类型断言，确保与 School 接口匹配
  //       };
  //     })
  //   );

  //   return schoolsWithGrades;
  // }

  /**
 * 按条件查询学校（支持厂商ID、名称模糊搜索、状态筛选）
 * @param params 查询参数（均为可选）
 * @returns 符合条件的学校数组
 */
  static async findByConditions(params: {
    manufacturer_id?: number; // 厂商ID筛选
    name?: string; // 名称模糊搜索
    status?: Status; // 状态筛选
  }): Promise<School[]> {
    // 基础SQL（查询学校基本信息）
    let sql = `
    SELECT id, name, type, manufacturer_id, status, education_years, created_at, updated_at
    FROM schools
    WHERE 1=1
  `;
    const queryParams: any[] = [];

    // 厂商ID筛选（存在则添加条件）
    if (params.manufacturer_id !== undefined) {
      sql += ' AND manufacturer_id = ?';
      queryParams.push(params.manufacturer_id);
      console.log('SQL条件：添加manufacturer_id =', params.manufacturer_id);
    }

    // 名称模糊搜索（存在则添加LIKE条件）
    if (params.name) {
      sql += ' AND name LIKE ?';
      queryParams.push(`%${params.name}%`); // 前后加%实现模糊匹配
      console.log('SQL条件：添加name LIKE', `%${params.name}%`);
    }

    // 状态筛选（存在则添加条件）
    if (params.status !== undefined) {
      sql += ' AND status = ?';
      queryParams.push(params.status);
      console.log('SQL条件：添加status =', params.status);
    }

    // 按创建时间排序
    sql += ' ORDER BY created_at DESC';
    console.log('执行的SQL:', sql);
    console.log('SQL参数:', queryParams);

    // 执行查询并处理结果
    const schools = await executeQuery<Omit<School, 'grades'>>(sql, queryParams)

    return schools;
  }


}

export default SchoolModel;
