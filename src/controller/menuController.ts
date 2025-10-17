import { Request, Response } from 'express';
import { filterMenusByRole } from '../services/menuService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import logger from '../utils/logger';
import { UserRole } from '../types/database.types';
import { JwtPayload } from '../utils/jwt'; // 导入JWT payload类型

/**
 * 获取当前用户有权限的菜单
 */
export const getUserMenus = async (req: Request, res: Response) => {
    try {

        const user = req.user as JwtPayload;
        if (!user) {
            return sendError(res, '用户信息获取失败', 401);
        }

        // 提取角色并验证
        const { role } = user;
        if (!role || !Object.values(UserRole).includes(role)) {
            return sendError(res, '无效的用户角色', 400);
        }

        const accessibleMenus = await filterMenusByRole(role);
        return sendSuccess(
            res,
            accessibleMenus,
            '获取菜单权限成功',
            200
        );
    } catch (error) {
        logger.error('获取用户菜单失败:', error);
        return sendError(
            res,
            '服务器错误，获取菜单失败',
            500
        );
    }
};
