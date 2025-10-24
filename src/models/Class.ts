import { executeQuery, executeWrite, QueryResult, WriteResult } from '../config/database';
import { Class } from '../types/gradeClass.types';

class ClassModel {
  /**
   * 创建单个班级
   */
  static async create(data: Omit<Class, 'id' | 'created_at' | 'updated_at'>): Promise<Class> {
    const sql = `
      INSERT INTO classes (name, class_order, grade_id, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    const result: WriteResult = await executeWrite(sql, [
      data.name,
      data.class_order,
      data.grade_id
    ]);

    return {
      id: result.insertId as number,
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * 批量创建班级
   */
  static async bulkCreate(classes: Omit<Class, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    if (classes.length === 0) return;

    const sql = `
      INSERT INTO classes (name, class_order, grade_id, created_at, updated_at)
      VALUES ${classes.map(() => '(?, ?, ?, NOW(), NOW())').join(',')}
    `;
    const params = classes.flatMap(cls => [cls.name, cls.class_order, cls.grade_id]);
    await executeWrite(sql, params);
  }

  /**
   * 根据年级ID查询班级
   */
  static async findByGradeId(gradeId: number): Promise<Class[]> {
    const sql = `
    SELECT id, name, grade_id, school_id
    FROM classes
    WHERE grade_id = ?
    ORDER BY id ASC
  `;
    return executeQuery<Class>(sql, [gradeId]);
  }

  /**
   * 根据ID更新班级
   */
  static async update(id: number, data: Partial<Omit<Class, 'id' | 'grade_id' | 'created_at' | 'updated_at'>>): Promise<Class | null> {
    const updateFields = Object.entries(data)
      .filter(([_, val]) => val !== undefined)
      .map(([key]) => `${key} = ?`);

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    const sql = `
      UPDATE classes
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;
    const params = [...Object.values(data).filter(val => val !== undefined), id];
    await executeWrite(sql, params);

    return this.findById(id);
  }

  /**
   * 根据ID查询单个班级
   */
  static async findById(id: number): Promise<Class | null> {
    const sql = `
      SELECT id, name, class_order, grade_id, created_at, updated_at
      FROM classes
      WHERE id = ?
    `;
    const rows = await executeQuery<Class>(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 根据年级ID删除班级
   */
  static async deleteByGradeId(gradeId: number): Promise<void> {
    const sql = 'DELETE FROM classes WHERE grade_id = ?';
    await executeWrite(sql, [gradeId]);
  }

  /**
   * 删除年级下除指定ID外的所有班级（用于更新）
   */
  static async deleteByGradeIdExcluding(gradeId: number, keepIds: number[]): Promise<void> {
    const sql = `DELETE FROM classes WHERE grade_id = ? AND id NOT IN (${keepIds.map(() => '?').join(',')})`;
    await executeWrite(sql, [gradeId, ...keepIds]);
  }

  /**
   * 删除单个班级
   */
  static async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM classes WHERE id = ?';
    const result: WriteResult = await executeWrite(sql, [id]);
    return result.affectedRows > 0;
  }
}

export default ClassModel;
