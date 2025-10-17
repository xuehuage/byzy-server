
import { Request, Response } from 'express';

/**
     * 获取厂商ID，超管自己没有厂商ID属性
     */
export const findAndValidUserId = (req: Request, res: Response): number => {
    const currentUser = req.user
    let manufacturerId = currentUser?.manufacturerId
    if (!currentUser) {
        throw new Error('登录过期，请重新登录。')
        // 补充登录逻辑

    }
    if (currentUser.role === 'super_admin') {
        manufacturerId = Number(req.query.id);
    }
    if (!manufacturerId) {
        throw new Error('登录过期，请重新登录。')
    }
    return manufacturerId
}
/**
 * 
 */