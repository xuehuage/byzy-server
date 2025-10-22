import express from 'express';
import {
    createStudent,
    getStudentDetail,
    countStudentsBySchool,
    countStudentsByGrade,
    countStudentsByClass,
    getStudentByidCard
} from '../services/studentService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { getStudentsByCascadeController } from '../controller/studentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/list', authenticate, getStudentsByCascadeController);

// // 创建学生
// router.post('/', async (req, res) => {
//     try {
//         const student = await createStudent(req.body);
//         sendSuccess(res, student);
//     } catch (error) {
//         sendError(res, (error as Error).message);
//     }
// });

// // 获取学生详情
// router.get('/:id', async (req, res) => {
//     try {
//         const student = await getStudentDetail(Number(req.params.id));
//         if (student) sendSuccess(res, student);
//         else sendError(res, '学生不存在', 404);
//     } catch (error) {
//         sendError(res, (error as Error).message);
//     }
// });

// // 统计全校人数
// router.get('/stats/school/:schoolId', async (req, res) => {
//     try {
//         const stats = await countStudentsBySchool(Number(req.params.schoolId));
//         sendSuccess(res, stats);
//     } catch (error) {
//         sendError(res, (error as Error).message);
//     }
// });

// // 统计年级人数
// router.get('/stats/grade/:gradeId', async (req, res) => {
//     try {
//         const stats = await countStudentsByGrade(Number(req.params.gradeId));
//         sendSuccess(res, stats);
//     } catch (error) {
//         sendError(res, (error as Error).message);
//     }
// });

// // 统计班级人数
// router.get('/stats/class/:classId', async (req, res) => {
//     try {
//         const stats = await countStudentsByClass(Number(req.params.classId));
//         sendSuccess(res, stats);
//     } catch (error) {
//         sendError(res, (error as Error).message);
//     }
// });



export default router;