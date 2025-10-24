import { executeQuery, executeWrite, QueryResult, WriteResult } from '../config/database';
import { Student, Gender, StudentRawRecord } from '../types/student.types';
import { formatBigInt } from '../utils/formatter';
import { mergeStudentOrders } from '../utils/studentDataProcessor';

// 定义计数查询结果的类型（局部使用，不影响全局）
interface CountResult {
  total: number;
}

class StudentModel {

  /**
* 通过身份证号查询学生详情
* @param idCard 身份证号
* @returns 学生详情 */
  static async findByidCard(idCard: string): Promise<Student | null> {
    const sql = `
    SELECT 
      s.*,
      c.name as class_name,
      g.name as grade_name,
      sch.name as school_name
    FROM students s
    JOIN classes c ON s.class_id = c.id
    JOIN grades g ON c.grade_id = g.id
    JOIN schools sch ON g.school_id = sch.id
    WHERE s.id_card = ?
  `;
    const rows = await executeQuery<(Student & {
      class_name: string;
      grade_name: string;
      school_name: string
    })>(sql, [idCard]);

    if (rows.length === 0) return null;

    const student = rows[0];
    return student;
  }
  /**
   * 创建单个学生
   * @param data 学生信息（不含id和时间戳）
   * @returns 创建的学生记录
   */
  static async create(data: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
    const sql = `
      INSERT INTO students (
        name, id_card, student_id, class_id, gender, 
        uniform_size, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const result: WriteResult = await executeWrite(sql, [
      data.name,
      data.id_card,
      data.student_id,
      data.class_id,
      data.gender,
      data.uniform_size,
    ]);

    return {
      id: result.insertId as number,
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * 批量创建学生（用于Excel导入）
   * @param students 学生数组
   * @returns 操作结果
   */
  static async bulkCreate(students: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    if (students.length === 0) return;

    const sql = `
      INSERT INTO students (
        name, id_card, student_id, class_id, gender, 
        uniform_size,  created_at, updated_at
      ) VALUES ${students.map(() => '(?, ?, ?, ?, ?, ?, ?, NOW(), NOW())').join(',')}
    `;
    const params = students.flatMap(student => [
      student.name,
      student.id_card,
      student.student_id,
      student.class_id,
      student.gender,
      student.uniform_size,
    ]);
    await executeWrite(sql, params);
  }

  /**
   * 根据班级ID查询学生
   * @param classId 班级ID
   * @returns 学生列表
   */
  static async findByClassId(classId: number): Promise<Student[]> {
    const sql = `
      SELECT * FROM students
      WHERE class_id = ?
      ORDER BY name ASC
    `;
    return executeQuery<Student>(sql, [classId]);
  }

  /**
   * 查询学生详情（含班级、年级、学校信息）
   * @param studentId 学生ID
   * @returns 学生详情
   */
  static async findDetailById(studentId: number): Promise<Student | null> {
    const sql = `
      SELECT 
        s.*,
        c.name as class_name,
        g.name as grade_name,
        sch.name as school_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN schools sch ON g.school_id = sch.id
      WHERE s.id = ?
    `;
    const rows = await executeQuery<(Student & {
      class_name: string;
      grade_name: string;
      school_name: string
    })>(sql, [studentId]);

    if (rows.length === 0) return null;

    const student = rows[0];
    return student
  }



  /**
   * 统计年级人数及男女数量
   * @param gradeId 年级ID
   * @returns 统计结果
   */
  static async countByGrade(gradeId: number): Promise<{
    total: number;
    male_count: number;
    female_count: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN s.gender = ? THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN s.gender = ? THEN 1 ELSE 0 END) as female_count
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.grade_id = ?
    `;
    const rows = await executeQuery(sql, [
      Gender.MALE,
      Gender.FEMALE,
      gradeId
    ]);
    return rows[0] as any;
  }

  /**
   * 统计班级人数及男女数量
   * @param classId 班级ID
   * @returns 统计结果
   */
  static async countByClass(classId: number): Promise<{
    total: number;
    male_count: number;
    female_count: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN gender = ? THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN gender = ? THEN 1 ELSE 0 END) as female_count
      FROM students
      WHERE class_id = ?
    `;
    const rows = await executeQuery(sql, [
      Gender.MALE,
      Gender.FEMALE,
      classId
    ]);
    return rows[0] as any;
  }


  /**
 * 查询全校/年级/班级学生详情执行级联查询（仅处理数据访问，返回原始结果）
 * @param whereClause SQL条件子句
 * @param queryParams 条件参数
 * @param limit 分页条数
 * @param offset 分页偏移量
 * @returns 原始查询结果（学生列表+总数）
 */
  static async queryByCascade(whereClause: string,
    queryParams: any[],
    limit: number,
    offset: number) {
    const studentIdsSql = `
    SELECT DISTINCT 
      s.id AS student_id,
      s.created_at  
    FROM students s
    INNER JOIN classes c ON s.class_id = c.id
    INNER JOIN grades g ON c.grade_id = g.id
    INNER JOIN schools sch ON g.school_id = sch.id
    ${whereClause}
    ORDER BY s.created_at DESC  
    LIMIT ? OFFSET ?
  `;

    // 执行学生ID查询（参数：原条件 + limit + offset）
    const studentIdsResult = await executeQuery(
      studentIdsSql.replace(/\s+/g, ' ').trim(),
      [...queryParams, limit, offset]
    );
    // 提取学生ID（忽略新增的created_at字段，不影响后续逻辑）
    const studentIds = studentIdsResult.map((item: any) => item.student_id);

    // 若没有学生ID，直接返回空列表
    if (studentIds.length === 0) {
      return { list: [], total: 0 };
    }

    // --------------------------
    // 第二步：根据学生ID查询详细信息（含订单）
    // --------------------------
    // 构建学生ID的IN条件（如：WHERE s.id IN (1,2,3,...)）
    const idsPlaceholders = studentIds.map(() => '?').join(',');
    const detailWhereClause = `WHERE s.id IN (${idsPlaceholders})`;

    // 字段定义（保留你需要的字段）
    const studentFields = [
      's.id AS student_id',
      's.name AS student_name',
      's.gender',
      's.id_card',
      's.created_at' // 用于排序（需包含在SELECT中）
    ].join(', ');

    const classFields = ['c.name AS class_name'].join(', ');
    const gradeFields = ['g.name AS grade_name'].join(', ');
    const schoolFields = ['sch.name AS school_name'].join(', ');
    const orderFields = [
      'suo.id AS order_id',
      'suo.order_type',
      'suo.payment_status',
      'suo.payment_time',
      'suo.quantity',
      'suo.size',
      'suo.total_amount'
    ].join(', ');
    const uniformFields = [
      'su.id AS uniform_id',
      'su.uniform_type',
      'su.price AS uniform_price'
    ].join(', ');

    // 关联表语句
    const joinTables = `
    FROM students s
    INNER JOIN classes c ON s.class_id = c.id
    INNER JOIN grades g ON c.grade_id = g.id
    INNER JOIN schools sch ON g.school_id = sch.id
    LEFT JOIN student_uniform_orders suo ON s.id = suo.student_id
    LEFT JOIN school_uniforms su ON suo.school_uniform_id = su.id
  `.trim();

    // 清理SQL
    const cleanSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

    // 详情查询SQL
    const detailSql = cleanSql(`
    SELECT
      ${studentFields},
      ${classFields},
      ${gradeFields},
      ${schoolFields},
      ${orderFields},
      ${uniformFields}
    ${joinTables}
    ${detailWhereClause}
    ORDER BY s.created_at DESC
  `);

    // --------------------------
    // 第三步：查询总学生数（保持不变）
    // --------------------------
    const countSql = cleanSql(`
    SELECT COUNT(DISTINCT s.id) AS total
    FROM students s
    INNER JOIN classes c ON s.class_id = c.id
    INNER JOIN grades g ON c.grade_id = g.id
    INNER JOIN schools sch ON g.school_id = sch.id
    ${whereClause}
  `);

    try {
      // 执行详情查询（参数：学生ID列表）
      const detailData = await executeQuery(detailSql, studentIds);
      // 执行总数查询
      const countResult: { total: number }[] = await executeQuery(countSql, queryParams);

      // 处理BigInt并合并订单
      const formattedData = formatBigInt(detailData) as StudentRawRecord[];
      const mergedData = mergeStudentOrders(formattedData);

      return {
        list: mergedData,
        total: formatBigInt(countResult[0]?.total || 0) as number
      };
    } catch (error) {
      console.error('数据库查询失败：', error);
      throw new Error(`查询学生失败: ${(error as Error).message}`);
    }
  }
}

export default StudentModel;