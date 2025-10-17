import { Request, Response } from 'express';
import classService from '../services/classService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { findAndValidUserId } from '../utils/helpers'

export default {
  // /**
  //  * 为年级添加班级
  //  */
  // createClass: async (req: Request, res: Response) => {
  //   try {
  //     const { gradeId } = req.params;
  //     const classData = req.body;
  //     const manufacturerId = findAndValidUserId(req,res)

  //     const newClass = await classService.createClass(
  //       { ...classData, grade_id: Number(gradeId) },
  //       manufacturerId
  //     );

  //     return sendSuccess(res, newClass, 'Class created successfully', 201);
  //   } catch (error) {
  //     console.error('Create class error:', error);
  //     return sendError(res, (error as Error).message, 400);
  //   }
  // },

  // /**
  //  * 获取年级的所有班级
  //  */
  // getClassesByGrade: async (req: Request, res: Response) => {
  //   try {
  //     const { gradeId } = req.params;
  //    const manufacturerId = findAndValidUserId(req,res)

  //     const classes = await classService.getClassesByGrade(Number(gradeId), manufacturerId);
  //     return sendSuccess(res, classes, 'Classes retrieved successfully');
  //   } catch (error) {
  //     console.error('Get classes error:', error);
  //     return sendError(res, (error as Error).message, 400);
  //   }
  // },

  // /**
  //  * 更新班级
  //  */
  // updateClass: async (req: Request, res: Response) => {
  //   try {
  //     const { classId } = req.params;
  //     const updateData = req.body;
  //    const manufacturerId = findAndValidUserId(req,res)

  //     const updatedClass = await classService.updateClass(Number(classId), updateData, manufacturerId);
  //     if (!updatedClass) {
  //       return sendError(res, 'Class not found', 404);
  //     }

  //     return sendSuccess(res, updatedClass, 'Class updated successfully');
  //   } catch (error) {
  //     console.error('Update class error:', error);
  //     return sendError(res, (error as Error).message, 400);
  //   }
  // },

  // /**
  //  * 删除班级
  //  */
  // deleteClass: async (req: Request, res: Response) => {
  //   try {
  //     const { classId } = req.params;
  //     const manufacturerId = findAndValidUserId(req,res)

  //     const isDeleted = await classService.deleteClass(Number(classId), manufacturerId);
  //     if (!isDeleted) {
  //       return sendError(res, 'Class not found', 404);
  //     }

  //     return sendSuccess(res, {}, 'Class deleted successfully');
  //   } catch (error) {
  //     console.error('Delete class error:', error);
  //     return sendError(res, (error as Error).message, 400);
  //   }
  // }
};
