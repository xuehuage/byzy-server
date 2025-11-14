import { executeQuery, executeWrite, WriteResult } from '../config/database';
import { StudentUniform, UniformStatistic } from '../types/studentUniform.types';
import { PaymentStatus } from '../types/database.types';
import { StudentOrder } from '../types/student.types';
import { SchoolUniformResult } from '../types/school.types';

class StudentUniformModel {
  /**
   * 创建学生校服购买记录
   * @param data 购买记录信息
   * @returns 创建的记录
   */
  static async create(data: Omit<StudentUniform, 'id' | 'created_at' | 'updated_at'>): Promise<StudentUniform> {
    // 1. 查询对应校服的单价
    const uniform = await executeQuery<SchoolUniformResult>(
      'SELECT price FROM school_uniforms WHERE id = ?',
      [data.school_uniform_id]
    );
    if (uniform.length === 0) {
      throw new Error('校服信息不存在');
    }
    const price = uniform[0].price;
    // 2. 计算总金额
    const totalAmount = data.quantity * price;

    // 3. 插入订单时包含total_amount
    const sql = `
    INSERT INTO student_uniform_orders (
      student_id, school_uniform_id, quantity, size, payment_status, 
      total_amount, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;
    const result: WriteResult = await executeWrite(sql, [
      data.student_id,
      data.school_uniform_id,
      data.quantity,
      data.size,
      data.payment_status,
      totalAmount // 存入计算后的总金额
    ]);

    return {
      id: result.insertId as number,
      ...data,
      total_amount: totalAmount, // 补充到返回结果
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * 批量创建学生校服购买记录（用于Excel导入）
   * @param records 购买记录数组
   * @returns 操作结果
   */
  static async bulkCreate(records: Omit<StudentUniform, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    if (records.length === 0) return;

    const sql = `
      INSERT INTO student_uniform_orders (  -- 表名修正为 student_uniform_orders
        student_id, school_uniform_id, quantity, size, payment_status, created_at, updated_at
      ) VALUES ${records.map(() => '(?, ?, ?, ?, ?, NOW(), NOW())').join(',')}
    `;
    const params = records.flatMap(record => [
      record.student_id,
      record.school_uniform_id,  // 同上：后续需修改类型定义字段名
      record.quantity,
      record.size,
      record.payment_status
    ]);
    await executeQuery(sql, params);
  }

  /**
   * 查询学生的校服购买记录
   * @param studentId 学生ID
   * @returns 购买记录列表
   */
  static async findByStudentId(studentId: number): Promise<StudentUniform[]> {
    const sql = `
      SELECT 
        id, 
        student_id, 
        sschool_uniform_id,  -- 字段映射：实际字段 school_uniform_id → 类型中的 uniform_id
        quantity, 
        size, 
        payment_status, 
        created_at, 
        updated_at 
      FROM student_uniform_orders  -- 表名修正
      WHERE student_id = ?
    `;
    return executeQuery<StudentUniform>(sql, [studentId]);
  }

  /**
   * 查询学生的校服购买记录（含价格信息）
   * @param studentId 学生ID
   * @returns 带价格的购买记录列表
   */
  static async findByStudentIdWithPrice(studentId: number): Promise<StudentOrder[]> {
    const sql = `
            SELECT 
      suo.id, 
      suo.student_id, 
      suo.size, 
      suo.quantity, 
      suo.total_amount, 
      suo.order_type, 
      suo.payment_time, 
      suo.payment_status,
      suo.created_at, 
      suo.updated_at, 
      su.uniform_type, 
      su.gender_type, 
      su.price
    FROM student_uniform_orders suo
    JOIN school_uniforms su ON suo.school_uniform_id = su.id
    WHERE suo.student_id = ?
        `;
    return executeQuery(sql, [studentId]);
  }

  /**
   * 统计班级校服购买情况
   * @param classId 班级ID
   * @returns 统计结果
   */
  static async statByClass(classId: number): Promise<UniformStatistic[]> {
    const sql = `
      SELECT 
        su_config.uniform_type,
        SUM(suo.quantity) as total_quantity,
        SUM(CASE WHEN suo.payment_status = ? THEN suo.quantity ELSE 0 END) as paid_quantity,
        SUM(CASE WHEN suo.payment_status = ? THEN suo.quantity ELSE 0 END) as unpaid_quantity
      FROM student_uniform_orders suo  -- 表名修正
      JOIN students s ON suo.student_id = s.id
      JOIN school_uniforms su_config ON suo.school_uniform_id = su_config.id  -- 关联字段修正
      WHERE s.class_id = ?
      GROUP BY su_config.uniform_type
    `;
    const rows = await executeQuery(sql, [
      PaymentStatus.PAID,
      PaymentStatus.UNPAID,
      classId
    ]);
    return rows as UniformStatistic[];
  }

  /**
   * 统计年级校服购买情况
   * @param gradeId 年级ID
   * @returns 统计结果
   */
  static async statByGrade(gradeId: number): Promise<UniformStatistic[]> {
    const sql = `
      SELECT 
        su_config.uniform_type,
        SUM(suo.quantity) as total_quantity,
        SUM(CASE WHEN suo.payment_status = ? THEN suo.quantity ELSE 0 END) as paid_quantity,
        SUM(CASE WHEN suo.payment_status = ? THEN suo.quantity ELSE 0 END) as unpaid_quantity
      FROM student_uniform_orders suo  -- 表名修正
      JOIN students s ON suo.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN school_uniforms su_config ON suo.school_uniform_id = su_config.id  -- 关联字段修正
      WHERE c.grade_id = ?
      GROUP BY su_config.uniform_type
    `;
    const rows = await executeQuery(sql, [
      PaymentStatus.PAID,
      PaymentStatus.UNPAID,
      gradeId
    ]);
    return rows as UniformStatistic[];
  }

  /**
   * 统计学校校服购买情况
   * @param schoolId 学校ID
   * @returns 统计结果
   */
  static async statBySchool(schoolId: number): Promise<UniformStatistic[]> {
    const sql = `
      SELECT 
        su_config.uniform_type,
        SUM(suo.quantity) as total_quantity,
        SUM(CASE WHEN suo.payment_status = ? THEN suo.quantity ELSE 0 END) as paid_quantity,
        SUM(CASE WHEN suo.payment_status = ? THEN suo.quantity ELSE 0 END) as unpaid_quantity
      FROM student_uniform_orders suo  -- 表名修正
      JOIN students s ON suo.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN school_uniforms su_config ON suo.school_uniform_id = su_config.id  -- 关联字段修正
      WHERE g.school_id = ?
      GROUP BY su_config.uniform_type
    `;
    const rows = await executeQuery(sql, [
      PaymentStatus.PAID,
      PaymentStatus.UNPAID,
      schoolId
    ]);
    return rows as UniformStatistic[];
  }
}

export default StudentUniformModel;