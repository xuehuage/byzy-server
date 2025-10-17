import StudentModel from '../models/StudentModel';
import StudentUniformModel from '../models/StudentUniformModel';
import { StudentByIdCardResult } from '../types/studentQuery.types';
import { Student, StudentDetail } from '../types/student.types';

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
    console.log("学生信息:", student)
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
export const getStudentDetail = async (studentId: number): Promise<StudentDetail | null> => {
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