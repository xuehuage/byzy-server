import { getMenusByRoleId, buildNestedMenus } from '../models/Menu';
import UserModel from '../models/User';
import { MenuItem } from '../types/menu.types';
import { UserRole } from '../types/database.types';
import { log } from 'console';

/**
 * 根据用户名获取有权限的菜单（从数据库查询）
 */
export const getUserMenus = async (username: string): Promise<MenuItem[]> => {
    const roleId = await UserModel.getUserRoleId(username);
    if (!roleId) {
        throw new Error('用户角色不存在');
    }
    return getMenusByRole(roleId); // 复用根据角色ID查询菜单的逻辑
};

/**
 * 根据角色ID从数据库查询对应的菜单（核心方法）
 * 供控制器直接调用（当已知角色ID时）
 */
export const getMenusByRole = async (roleId: number): Promise<MenuItem[]> => {
    // 1. 从角色-菜单关联表查询该角色拥有的菜单
    const flatMenus = await getMenusByRoleId(roleId);

    // 2. 构建嵌套菜单结构（支持多级子菜单）
    return buildNestedMenus(flatMenus);
};

/**
 * 根据角色标识（如'super_admin'）查询菜单
 * 适配控制器中从JWT获取的角色字符串
 */
export const filterMenusByRole = async (role: UserRole): Promise<MenuItem[]> => {
    // 1. 将角色标识（如'super_admin'）转换为角色ID（从角色表查询）
    const roleId = await UserModel.getRoleIdByRoleName(role);
    if (!roleId) {
        throw new Error(`角色${role}对应的ID不存在`);
    }

    // 2. 复用根据角色ID查询菜单的逻辑
    return getMenusByRole(roleId);
};
