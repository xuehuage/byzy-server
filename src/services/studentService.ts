import StudentModel from '../models/StudentModel';
import StudentUniformModel from '../models/StudentUniformModel';
import { StudentByIdCardResult } from '../types/studentQuery.types';
import { Student, StudentQueryParams } from '../types/student.types';

/**
 * 创建学生
 * @param studentData 学生信息
 * @returns 创建的学生
 */
export const createStudent = async (studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
    return await StudentModel.create(studentData);
};

/**
 * 通过身份证号查询学生及订单信息
 * @param idCard 身份证号
 * @returns 学生信息及关联订单
 */
export const getStudentByidCard = async (idCard: string): Promise<StudentByIdCardResult | null> => {
    // 1. 查询学生基本信息
    const student = await StudentModel.findByidCard(idCard);
    if (!student) return null;

    // 2. 查询学生订单信息（含金额计算）
    const orders = await StudentUniformModel.findByStudentIdWithPrice(student.id);

    return {
        student,
        orders
    };
};

/**
 * 批量创建学生
 * @param students 学生数组
 */
export const bulkCreateStudents = async (students: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]) => {
    await StudentModel.bulkCreate(students);
};

/**
 * 获取学生详情
 * @param studentId 学生ID
 * @returns 学生详情
 */
export const getStudentDetail = async (studentId: number): Promise<Student | null> => {
    return await StudentModel.findDetailById(studentId);
};

/**
 * 统计全校人数
 * @param schoolId 学校ID
 * @returns 统计结果
 */
export const countStudentsBySchool = async (schoolId: number) => {
    // return await StudentModel.countBySchool(schoolId);
};

/**
 * 统计年级人数
 * @param gradeId 年级ID
 * @returns 统计结果
 */
export const countStudentsByGrade = async (gradeId: number) => {
    return await StudentModel.countByGrade(gradeId);
};

/**
 * 统计班级人数
 * @param classId 班级ID
 * @returns 统计结果
 */
export const countStudentsByClass = async (classId: number) => {
    return await StudentModel.countByClass(classId);
};

/**
 * 查询全校/年级/班级
 * @returns 统计结果
 */
export const getStudentsByCascade = async (params: StudentQueryParams) => {
    // 1. 初始化条件和参数（严格一一对应）
    const whereParts: string[] = [];
    const queryParams: any[] = [];

    if (params.schoolId !== undefined) {
        whereParts.push('g.school_id = ?'); // 正确：用?占位
        queryParams.push(params.schoolId); // 参数单独存储，不直接拼入SQL
    } else if (params.gradeId !== undefined) {
        whereParts.push('c.grade_id = ?');
        queryParams.push(params.gradeId);
    } else if (params.classId !== undefined) {
        whereParts.push('s.class_id = ?');
        queryParams.push(params.classId);
    } else {
        throw new Error('至少需要提供schoolId、gradeId或classId中的一个');
    }

    // 其他筛选条件同理，均使用?占位
    if (params.uniformType !== undefined) {
        whereParts.push('su.uniform_type = ?');
        queryParams.push(params.uniformType);
    }
    if (params.paymentStatus !== undefined) {
        whereParts.push('suo.payment_status = ?');
        queryParams.push(params.paymentStatus);
    }

    // 生成whereClause（带?占位符）
    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // 打印Service层生成的条件和参数（关键调试）
    console.log('===== Service层调试 =====');
    console.log('whereClause（带占位符）:', whereClause); // 应输出 "WHERE g.school_id = ?"
    console.log('queryParams:', queryParams); // 应输出 [1]

    // 强制转换并校验分页参数（关键修复）
    const limit = Math.max(1, Math.min(100, Number(params.pageSize)));
    const offset = Math.max(0, (Number(params.page) - 1) * limit);

    // 新增：校验参数有效性，排除NaN
    if (isNaN(limit) || isNaN(offset)) {
        throw new Error(`分页参数无效：page=${params.page}, pageSize=${params.pageSize}`);
    }
    if (queryParams.some(param => param === undefined || param === null || isNaN(param))) {
        throw new Error(`查询参数包含无效值：${JSON.stringify(queryParams)}`);
    }

    // 打印参数类型（新增调试）
    console.log('===== 参数类型调试 =====');
    console.log('queryParams类型:', queryParams.map(p => typeof p)); // 应全为'number'
    console.log('limit类型:', typeof limit, '值:', limit); // 应为'number'
    console.log('offset类型:', typeof offset, '值:', offset); // 应为'number'

    // 调用Model层
    return await StudentModel.queryByCascade(whereClause, queryParams, limit, offset);
};