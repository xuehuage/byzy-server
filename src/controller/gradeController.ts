import { Request, Response } from 'express';
import gradeService from '../services/gradeService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { findAndValidUserId } from '../utils/helpers'

export default {
  /**
   * 创建年级
   */
  createGrade: async (req: Request, res: Response) => {
    try {
      const gradeData = req.body;
      if (!req.user) {
        return sendError(res, '未登录', 403);
      }
      const newGrade = await gradeService.createGrade(gradeData, req.user);
      return sendSuccess(res, newGrade, 'Grade created successfully', 201);
    } catch (error) {
      console.error('Create grade error:', error);
      return sendError(res, (error as Error).message, 400);
    }
  },

  /**
   * 获取学校的所有年级
   */
  getGradesBySchool: async (req: Request, res: Response) => {
    try {
      const { schoolId } = req.params;
      if (!req.user) {
        return sendError(res, '未登录', 403);
      }
      const grades = await gradeService.getGradesBySchool(Number(schoolId), req.user);
      return sendSuccess(res, grades, 'Grades retrieved successfully');
    } catch (error) {
      console.error('Get grades error:', error);
      return sendError(res, (error as Error).message, 400);
    }
  },

  /**
   * 更新年级
   */
  updateGrade: async (req: Request, res: Response) => {
    try {
      const { gradeId } = req.params;
      const updateData = req.body;
      if (!req.user) {
        return sendError(res, '未登录', 403);
      }

      const updatedGrade = await gradeService.updateGrade(Number(gradeId), updateData, req.user);
      if (!updatedGrade) {
        return sendError(res, 'Grade not found', 404);
      }

      return sendSuccess(res, updatedGrade, 'Grade updated successfully');
    } catch (error) {
      console.error('Update grade error:', error);
      return sendError(res, (error as Error).message, 400);
    }
  },

  /**
   * 删除年级
   */
  deleteGrade: async (req: Request, res: Response) => {
    try {
      const { gradeId } = req.params;
      if (!req.user) {
        return sendError(res, '未登录', 403);
      }

      const isDeleted = await gradeService.deleteGrade(Number(gradeId), req.user);
      if (!isDeleted) {
        return sendError(res, 'Grade not found', 404);
      }

      return sendSuccess(res, {}, 'Grade deleted successfully');
    } catch (error) {
      console.error('Delete grade error:', error);
      return sendError(res, (error as Error).message, 400);
    }
  },


};
