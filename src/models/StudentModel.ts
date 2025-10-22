import { executeQuery } from '../config/database';
import { Student, Gender } from '../types/student.types';
import { RowDataPacket } from 'mysql2';

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
        const rows = await executeQuery<(Student & RowDataPacket & {
            class_name: string;
            grade_name: string;
            school_name: string
        })[]>(sql, [idCard]);

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
        const result = await executeQuery<{ insertId: number }>(sql, [
            data.name,
            data.id_card,
            data.student_id,
            data.class_id,
            data.gender,
            data.uniform_size,
        ]);

        return {
            id: result.insertId,
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
        await executeQuery(sql, params);
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
        return executeQuery<Student[]>(sql, [classId]);
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
        const rows = await executeQuery<(Student & RowDataPacket & {
            class_name: string;
            grade_name: string;
            school_name: string
        })[]>(sql, [studentId]);

        if (rows.length === 0) return null;

        const student = rows[0];
        return student
    }

    /**
     * 统计全校人数及男女数量
     * @param schoolId 学校ID
     * @returns 统计结果
     */
    static async countBySchool(schoolId: number): Promise<{
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
      JOIN grades g ON c.grade_id = g.id
      WHERE g.school_id = ?
    `;
        const rows = await executeQuery<RowDataPacket[]>(sql, [
            Gender.MALE,
            Gender.FEMALE,
            schoolId
        ]);
        return rows[0] as any;
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
        const rows = await executeQuery<RowDataPacket[]>(sql, [
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
        const rows = await executeQuery<RowDataPacket[]>(sql, [
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
        // --------------------------
        // 1. 校验参数数量（关键：避免占位符与参数不匹配）
        // --------------------------
        // 统计whereClause中的占位符数量
        const placeholderCount = (whereClause.match(/\?/g) || []).length;
        // 校验：where条件的占位符数量必须与queryParams长度一致
        if (placeholderCount !== queryParams.length) {
            throw new Error(`参数数量不匹配：WHERE子句有${placeholderCount}个占位符，但收到${queryParams.length}个参数`);
        }

        // --------------------------
        // 2. 基础查询字段（与表结构严格对应）
        // --------------------------
        const baseFields = `
      -- 学生表字段
      s.id AS student_id,
      s.name AS student_name,
      s.class_id,
      s.gender,
      s.id_card,
      s.student_id AS student_no,
      s.source,
      s.created_at AS student_created_at,
      s.updated_at AS student_updated_at,
      
      -- 班级表字段
      c.name AS class_name,
      
      -- 年级表字段
      g.name AS grade_name,
      g.id AS grade_id,
      
      -- 学校表字段
      sch.id AS school_id,
      sch.name AS school_name,
      sch.type AS school_type,
      
      -- 学生订单表字段
      suo.payment_status,
      suo.payment_time,
      suo.total_amount,
      
      -- 校服表字段
      su_config.uniform_type,
      su_config.gender_type AS uniform_gender_type,
      su_config.price AS uniform_price
    `;

        // --------------------------
        // 3. 关联表SQL
        // --------------------------
        const joinTables = `
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN schools sch ON g.school_id = sch.id
      LEFT JOIN student_uniform_orders suo ON s.id = suo.student_id
      LEFT JOIN school_uniforms su_config ON suo.school_uniform_id = su_config.id
    `;

        // --------------------------
        // 4. 数据查询SQL（带分页）
        // --------------------------
        const dataSql = `
      SELECT DISTINCT s.id, ${baseFields}
      ${joinTables}
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
        // dataSql的占位符总数 = where条件的占位符 + 2（limit和offset）
        const dataPlaceholderTotal = placeholderCount + 2;
        const dataParams = [...queryParams, limit, offset];
        // 校验dataSql的参数数量
        if (dataParams.length !== dataPlaceholderTotal) {
            throw new Error(`数据查询参数不匹配：SQL有${dataPlaceholderTotal}个占位符，但收到${dataParams.length}个参数`);
        }

        // --------------------------
        // 5. 总数查询SQL
        // --------------------------
        const countSql = `
      SELECT COUNT(DISTINCT s.id) AS total
      ${joinTables}
      ${whereClause}
    `;
        // countSql的占位符数量 = where条件的占位符（无分页参数）
        if (queryParams.length !== placeholderCount) {
            throw new Error(`总数查询参数不匹配：SQL有${placeholderCount}个占位符，但收到${queryParams.length}个参数`);
        }

        // --------------------------
        // 6. 执行查询（添加调试日志）
        // --------------------------
        try {
            console.log('数据查询SQL:', dataSql);
            console.log('数据查询参数:', dataParams);
            console.log('总数查询SQL:', countSql);
            console.log('总数查询参数:', queryParams);

            const [students, countResult] = await Promise.all([
                executeQuery(dataSql, dataParams),
                executeQuery(countSql, queryParams) as Promise<CountResult[]>
            ]);

            return {
                list: students,
                total: countResult[0]?.total || 0
            };
        } catch (error) {
            console.error('数据库查询失败:', error);
            // 抛出详细错误信息，方便调试
            throw new Error(`数据库查询失败：${(error as Error).message}（SQL参数不匹配可能是原因）`);
        }
    }
}

export default StudentModel;