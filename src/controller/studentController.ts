import { Request, Response } from 'express';
import { getStudentsByCascade } from '../services/studentService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { PaymentStatus } from '../types';
import StudentModel from '../models/StudentModel';
import { StudentQueryParams } from '../types/student.types';

// 级联查询学生信息的控制器方法
export const getStudentsByCascadeController = async (req: Request, res: Response) => {
    try {
        // 1. 解析并转换请求参数（HTTP层处理）
        const params: StudentQueryParams = {
            schoolId: req.query.schoolId ? Number(req.query.schoolId) : undefined,
            gradeId: req.query.gradeId ? Number(req.query.gradeId) : undefined,
            classId: req.query.classId ? Number(req.query.classId) : undefined,
            uniformType: req.query.uniformType ? Number(req.query.uniformType) : undefined,
            paymentStatus: req.query.paymentStatus ? Number(req.query.paymentStatus) : undefined,
            page: req.query.page ? Number(req.query.page) : 1,
            pageSize: req.query.pageSize ? Number(req.query.pageSize) : 10
        };

        // 2. 调用Service层处理业务（委托业务逻辑）
        const result = await getStudentsByCascade(params);

        // 3. 封装并返回响应（HTTP层处理）
        return sendSuccess(res, result, '学生列表查询成功');
    } catch (error) {
        console.error('查询学生失败:', error);
        // 4. 错误响应处理
        return sendError(
            res,
            (error as Error).message || '查询失败',
            (error as any).statusCode || 500
        );
    }
};