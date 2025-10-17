import StudentUniformModel from '../models/StudentUniformModel';
import { StudentUniform, UniformStatistic } from '../types/studentUniform.types';

/**
 * 创建学生校服购买记录
 * @param data 购买记录信息
 * @returns 创建的记录
 */
export const createStudentUniform = async (data: Omit<StudentUniform, 'id' | 'created_at' | 'updated_at'>) => {
    return await StudentUniformModel.create(data);
};



/**
 * 批量创建购买记录
 * @param records 购买记录数组
 */
export const bulkCreateStudentUniforms = async (records: Omit<StudentUniform, 'id' | 'created_at' | 'updated_at'>[]) => {
    await StudentUniformModel.bulkCreate(records);
};

/**
 * 获取学生的校服购买记录
 * @param studentId 学生ID
 * @returns 购买记录列表
 */
export const getStudentUniforms = async (studentId: number) => {
    return await StudentUniformModel.findByStudentId(studentId);
};

/**
 * 统计班级校服购买情况
 * @param classId 班级ID
 * @returns 统计结果
 */
export const statUniformsByClass = async (classId: number): Promise<UniformStatistic[]> => {
    return await StudentUniformModel.statByClass(classId);
};

/**
 * 统计年级校服购买情况
 * @param gradeId 年级ID
 * @returns 统计结果
 */
export const statUniformsByGrade = async (gradeId: number): Promise<UniformStatistic[]> => {
    return await StudentUniformModel.statByGrade(gradeId);
};

/**
 * 统计学校校服购买情况
 * @param schoolId 学校ID
 * @returns 统计结果
 */
export const statUniformsBySchool = async (schoolId: number): Promise<UniformStatistic[]> => {
    return await StudentUniformModel.statBySchool(schoolId);
};