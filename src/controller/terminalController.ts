// src/controller/terminalController.ts
import { Request, Response } from 'express';
import { activateTerminal } from '../services/terminalService';
import { sendSuccess, sendError } from '../utils/apiResponse';

/**
 * 终端激活接口（供前端或系统初始化调用）
 */
export const activate = async (req: Request, res: Response) => {
    try {
        const { device_id } = req.body; // 从请求体获取设备ID
        if (!device_id) {
            return sendError(res, 'device_id为必填参数', 400);
        }
        const terminal = await activateTerminal(device_id);
        sendSuccess(res, terminal, '终端激活成功');
    } catch (error) {
        console.error('终端激活失败:', error);
        sendError(res, (error as Error).message, 500);
    }
};