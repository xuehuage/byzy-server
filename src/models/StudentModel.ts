import { executeQuery } from '../config/database';
import { Student, StudentDetail, Gender } from '../types/student.types';
import { RowDataPacket } from 'mysql2';

class StudentModel {

    /**
 * 通过身份证号查询学生详情
 * @param idCard 身份证号
 * @returns 学生详情 */
    static async findByidCard(idCard: string): Promise<StudentDetail | null> {
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
        return {
            ...student,
            class: {
                id: student.class_id,
                name: student.class_name,
                class_order: 0,
                grade_id: 0,
                created_at: new Date(),
                updated_at: new Date()
            },
            grade_name: student.grade_name,
            school_name: student.school_name
        };
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
        uniform_size, payment_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
        const result = await executeQuery<{ insertId: number }>(sql, [
            data.name,
            data.id_card,
            data.student_id,
            data.class_id,
            data.gender,
            data.uniform_size,
            data.payment_status
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
        uniform_size, payment_status, created_at, updated_at
      ) VALUES ${students.map(() => '(?, ?, ?, ?, ?, ?, ?, NOW(), NOW())').join(',')}
    `;
        const params = students.flatMap(student => [
            student.name,
            student.id_card,
            student.student_id,
            student.class_id,
            student.gender,
            student.uniform_size,
            student.payment_status
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
    static async findDetailById(studentId: number): Promise<StudentDetail | null> {
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
        return {
            ...student,
            class: {
                id: student.class_id,
                name: student.class_name,
                // 其他班级字段从数据库查询补充
                class_order: 0, // 实际场景需从classes表查询
                grade_id: 0, // 实际场景需从classes表查询
                created_at: new Date(),
                updated_at: new Date()
            },
            grade_name: student.grade_name,
            school_name: student.school_name
        };
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
}

export default StudentModel;