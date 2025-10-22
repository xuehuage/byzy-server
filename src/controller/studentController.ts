import { Request, Response } from 'express';
import { getStudentsByCascade } from '../services/studentService';
import { sendSuccess, sendError } from '../utils/apiResponse';

// 级联查询学生信息的控制器方法
export const getStudentsByCascadeController = async (req: Request, res: Response) => {
    try {
        // 1. 解析并转换参数（URL参数为字符串，需转为数字）
        const { schoolId, gradeId, classId } = req.query;
        const params = {
            schoolId: schoolId ? Number(schoolId) : undefined,
            gradeId: gradeId ? Number(gradeId) : undefined,
            classId: classId ? Number(classId) : undefined
        };

        // 2. 参数校验（必传参数检查）
        if (!params.schoolId) {
            return sendError(res, '学校ID为必传参数', 400);
        }
        if (params.classId && !params.gradeId) {
            return sendError(res, '查询班级学生需同时传入年级ID', 400);
        }

        // 3. 调用服务层处理业务逻辑
        const result = await getStudentsByCascade(
            params.schoolId,
            params.gradeId,
            params.classId
        );

        // 4. 封装成功响应
        sendSuccess(res, result);
    } catch (error) {
        // 5. 封装错误响应
        sendError(res, (error as Error).message);
    }
};