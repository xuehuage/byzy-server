import schedule from 'node-schedule';
import MergedOrderTempModel from '../models/MergedOrderTempModel';

/**
 * 初始化临时订单清理任务（每10分钟执行一次）
 */
export const initTempOrderCleanup = () => {
    // 每10分钟清理一次过期订单（expire_at < 当前时间）
    schedule.scheduleJob('*/10 * * * *', async () => {
        try {
            const now = new Date();
            const { affectedRows } = await MergedOrderTempModel.deleteExpired(now);
            console.log(`[${now.toISOString()}] 清理过期临时订单 ${affectedRows} 条`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 临时订单清理失败:`, error);
        }
    });
};