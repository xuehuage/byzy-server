// src/controller/publicController.ts (新增文件)
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import SchoolModel from '../models/School';
import { getStudentByidCard } from '../services/studentService';


/**
 * 获取公开的学校详情（不含敏感信息）
 */
export const getPublicSchoolDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const school = await SchoolModel.findPublicSchoolDetail(Number(id));

        if (!school) {
            return sendError(res, '学校不存在', 404);
        }

        sendSuccess(res, school, '学校详情获取成功');
    } catch (error) {
        sendError(res, (error as Error).message || '获取学校详情失败');
    }
};

/**
 * 获取公开的学校详情（不含敏感信息）
 */
export const getPublicStudent = async (req: Request, res: Response) => {
    try {
        const { id_card } = req.params;
        const result = await getStudentByidCard(id_card);

        if (result) {
            sendSuccess(res, result, '学生信息获取成功');
        } else {
            sendError(res, '未找到该学生信息', 200, 404);
        }
    } catch (error) {
        sendError(res, '获取学生信息失败', 200, 500);
    }
};