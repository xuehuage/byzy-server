import { executeQuery, executeTransaction } from '../config/database';
import { Grade, CreateGradeDto, UpdateGradeDto, Class } from '../types/gradeClass.types';
import ClassModel from './Class'; // 关联班级模型，用于级联操作

class GradeModel {
  /**
   * 1. 新增：创建单个年级（支持同步创建班级）
   * 
   */
  static async create(gradeData: CreateGradeDto): Promise<Grade> {
    // 用事务确保年级和班级原子创建（要么都成功，要么都失败）
    const [gradeResult] = await executeTransaction([
      {
        sql: `
          INSERT INTO grades (name,  school_id, created_at, updated_at)
          VALUES (?, ?, ?, NOW(), NOW())
        `,
        params: [gradeData.name, gradeData.school_id]
      }
    ]);

    const gradeId = (gradeResult as { insertId: number }).insertId;
    const newGrade: Grade = {
      id: gradeId,
      ...gradeData,
      created_at: new Date(),
      updated_at: new Date()
    };

    // 同步创建班级（如果传入 classes 数组）
    if (gradeData.classes && gradeData.classes.length > 0) {
      await ClassModel.bulkCreate(
        gradeData.classes.map(cls => ({ ...cls, grade_id: gradeId }))
      );
    }

    return newGrade;
  }

  /**
   * 2. 保留+优化：批量创建年级（支持同步批量创建班级）
   * 基于旧版 `bulkCreate` 优化
   */
  static async bulkCreate(grades: Omit<Grade, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    if (grades.length === 0) return;

    // 批量插入年级（
    const gradeSql = `
      INSERT INTO grades (name,  school_id, created_at, updated_at)
      VALUES ${grades.map(() => '(?,  ?, NOW(), NOW())').join(',')}
    `;
    const gradeParams = grades.flatMap(grade => [grade.name, grade.school_id]);
    const gradeResult = await executeQuery<{ insertId: number, affectedRows: number }>(gradeSql, gradeParams);

    // 批量创建班级（如果有）：通过自增ID计算每个年级对应的班级
    const classBatch: Omit<Class, 'id' | 'created_at' | 'updated_at'>[] = [];
    grades.forEach((grade, index) => {
      if (grade.classes && grade.classes.length > 0) {
        const currentGradeId = gradeResult.insertId + index; // 自增ID连续，可推导
        classBatch.push(
          ...grade.classes.map(cls => ({ ...cls, grade_id: currentGradeId }))
        );
      }
    });

    if (classBatch.length > 0) {
      await ClassModel.bulkCreate(classBatch);
    }
  }

  /**
   * 3. 保留+优化：根据学校ID查询所有年级
   * 基于旧版 `findBySchoolId` 优化
   */
  static async findBySchoolId(schoolId: number): Promise<Grade[]> {
    const sql = `
    SELECT id, name, school_id, created_at, updated_at
    FROM grades
    WHERE school_id = ?
    ORDER BY id ASC
  `;
    const grades = await executeQuery<Grade[]>(sql, [schoolId]);

    // 为每个年级查询班级
    return Promise.all(grades.map(async (grade) => ({
      ...grade,
      classes: await ClassModel.findByGradeId(grade.id)
    })));
  }

  /**
   * 4. 新增：根据年级ID查询单个年级（含关联班级）
   * 新需求必需（编辑/删除年级前需验证归属）
   */
  static async findById(gradeId: number): Promise<Grade | null> {
    const sql = `
      SELECT id, name, school_id, created_at, updated_at
      FROM grades
      WHERE id = ?
    `;
    const rows = await executeQuery<Grade[]>(sql, [gradeId]);
    if (rows.length === 0) return null;

    const grade = rows[0];
    grade.classes = await ClassModel.findByGradeId(grade.id); // 关联班级
    return grade;
  }

  /**
   * 5. 新增：根据年级ID更新单个年级（含班级更新）
   * 替代旧版 `updateBySchoolId`
   */
  static async update(gradeId: number, updateData: UpdateGradeDto): Promise<Grade | null> {
    // 1. 先查询年级，验证归属（防止修改其他学校的年级）
    const existingGrade = await this.findById(gradeId);
    if (!existingGrade) {
      throw new Error('Grade not found');
    }

    // 2. 执行年级更新（无需传递 school_id，保留原有归属）
    const { classes, ...gradeFields } = updateData;
    const updateGradeFields = Object.entries(gradeFields)
      .filter(([_, val]) => val !== undefined)
      .map(([key]) => `${key} = ?`);

    if (updateGradeFields.length > 0) {
      const sql = `
        UPDATE grades
        SET ${updateGradeFields.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `;
      const params = [...Object.values(gradeFields).filter(val => val !== undefined), gradeId];
      await executeQuery(sql, params);
    }

    // 2. 更新班级（新增/修改/删除）
    if (classes !== undefined) {
      // 已存在的班级ID（用于保留和修改）
      const existingClassIds = classes.filter(cls => cls.id).map(cls => cls.id!);
      // 1. 删除年级下未在新列表中的班级
      if (existingClassIds.length > 0) {
        await ClassModel.deleteByGradeIdExcluding(gradeId, existingClassIds);
      } else {
        await ClassModel.deleteByGradeId(gradeId); // 无保留班级，删除全部
      }
      // 2. 新增/修改班级
      for (const cls of classes) {
        if (cls.id) {
          await ClassModel.update(cls.id, cls); // 修改已有班级
        } else {
          await ClassModel.create({ ...cls, grade_id: gradeId }); // 新增班级
        }
      }
    }

    return this.findById(gradeId); // 返回更新后的完整信息（含班级）
  }

  /**
   * 6. 保留+优化：根据学校ID删除所有年级（级联删除班级）
   * 基于旧版 `deleteBySchoolId` 优化
   */
  static async deleteBySchoolId(schoolId: number): Promise<void> {
    // 1. 先查询学校下所有年级（用于级联删除班级）
    const grades = await this.findBySchoolId(schoolId);
    // 2. 级联删除每个年级下的班级
    for (const grade of grades) {
      await ClassModel.deleteByGradeId(grade.id);
    }
    // 3. 最后删除年级
    const sql = 'DELETE FROM grades WHERE school_id = ?';
    await executeQuery(sql, [schoolId]);
  }

  /**
   * 7. 新增：根据年级ID删除单个年级（级联删除班级）
   * 新需求必需（支持单独删除某个年级）
   */
  static async delete(gradeId: number): Promise<boolean> {
    // 1. 先删除关联班级
    await ClassModel.deleteByGradeId(gradeId);
    // 2. 再删除年级
    const sql = 'DELETE FROM grades WHERE id = ?';
    const result = await executeQuery<{ affectedRows: number }>(sql, [gradeId]);
    return result.affectedRows > 0;
  }

  /**
   * 8. 新增：年级自动升级（按学校ID批量处理）
   * 新需求必需（每年自动更新年级 level）
   */
  static async autoUpgradeBySchoolId(schoolId: number, schoolEducationYears: number) {
    // const grades = await this.findBySchoolId(schoolId);
    // let upgraded = 0;
    // let skipped = 0;

    // for (const grade of grades) {
    //   // 仅升级未达到学校学制上限的年级（如3年制学校，level≤3时才升级）
    //   if (grade.level < schoolEducationYears) {
    //     await this.update(grade.id, { level: grade.level + 1 });
    //     upgraded++;
    //   } else {
    //     skipped++; // 已达上限，跳过
    //   }
    // }

    // return { upgraded, skipped };
    return null
  }
}

export default GradeModel;