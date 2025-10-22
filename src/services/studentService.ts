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
    return await StudentModel.countBySchool(schoolId);
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
    const { schoolId, gradeId, classId, uniformType, paymentStatus, page, pageSize } = params;

    // 1. 业务规则校验（级联条件必须至少有一个）
    if (!schoolId && !gradeId && !classId) {
        throw new Error('至少需要提供schoolId、gradeId或classId中的一个');
    }

    // 2. 构建查询条件（级联优先级：classId > gradeId > schoolId）
    const whereParts: string[] = [];
    const queryParams: any[] = [];

    if (classId) {
        whereParts.push('s.class_id = ?');
        queryParams.push(classId);
    } else if (gradeId) {
        whereParts.push('c.grade_id = ?');
        queryParams.push(gradeId);
    } else if (schoolId) {
        whereParts.push('g.school_id = ?');
        queryParams.push(schoolId);
    }

    // 3. 筛选条件：校服类型
    if (uniformType) {
        whereParts.push('su_config.uniform_type = ?');
        queryParams.push(uniformType);
    }

    // 4. 筛选条件：支付状态
    if (paymentStatus !== undefined) {
        whereParts.push('suo.payment_status = ?');
        queryParams.push(paymentStatus);
    }

    // 5. 组装WHERE子句
    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // 6. 分页参数处理
    const limit = pageSize || 10;
    const offset = ((page || 1) - 1) * limit;

    // 7. 调用Model层执行查询
    const { list, total } = await StudentModel.queryByCascade(whereClause, queryParams, limit, offset);



    return {
        list,
        total

    };
};