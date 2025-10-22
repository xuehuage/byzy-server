// src/routes/index.ts
import express from 'express';
import authRoutes from './auth';
import manufacturerRoutes from './manufacturers';
import schoolRoutes from './schools';
import gradeRoutes from './grades';
import classRoutes from './classes';
import menusRoutes from './menus';
import publicRoutes from './public';
import studentRoutes from './studentRoutes';



const router = express.Router();

// 公开路由 - 不需要认证
router.use('/public', publicRoutes);

// 挂载各模块路由
router.use('/auth', authRoutes);           // 认证相关路由：/api/auth
router.use('/manufacturer', manufacturerRoutes); // 厂商相关路由：/api/manufacturers
router.use('/schools', schoolRoutes);
router.use('/grades', gradeRoutes);
router.use('/menus', menusRoutes);
router.use('/students', studentRoutes);
router.use('/', classRoutes); // 与年级路由合并

export default router;
