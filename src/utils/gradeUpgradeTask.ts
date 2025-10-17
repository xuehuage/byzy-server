// src/utils/gradeUpgradeTask.ts（修复后）
import cron from 'node-cron';
import gradeService from '../services/gradeService';
import logger from './logger';



// 在 app.ts 中的启动逻辑保持不变（仍需调用 start()）：
// const gradeUpgradeTask = setupGradeUpgradeTask();
// gradeUpgradeTask.start();