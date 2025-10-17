import { pool } from '../config/database'; // 复用项目数据库连接
import { MenuItem } from '../types/menu.types';

// 根据角色ID查询有权限的菜单
export const getMenusByRoleId = async (roleId: number): Promise<MenuItem[]> => {
  const query = `
    SELECT 
      m.id, m.name, m.path, m.component, m.icon,  m.showInMenu, m.parent_id, m.sort
    FROM 
      role_menu rm
    JOIN 
      menus m ON rm.menu_id = m.id
    WHERE 
      rm.role_id = ? AND m.status = 1
    ORDER BY 
      m.sort ASC
  `;

  const [rows] = await pool.execute(query, [roleId]);
  console.log('rows:', rows)
  return rows as MenuItem[];
};

// 递归处理菜单，生成嵌套结构（支持多级菜单）
export const buildNestedMenus = (menus: MenuItem[]): MenuItem[] => {
  const menuMap: Record<number, MenuItem> = {};
  const result: MenuItem[] = [];
  // 先将所有菜单存入Map，方便查找父菜单
  menus.forEach(menu => {
    menuMap[menu.id] = { ...menu, children: [] };
  });

  // 构建嵌套关系
  menus.forEach(menu => {
    const current = menuMap[menu.id];
    if (menu.parent_id === 0) {
      // 顶级菜单直接放入结果
      result.push(current);
    } else {
      // 子菜单放入父菜单的children
      const parent = menuMap[menu.parent_id];

      if (parent) {
        parent.children?.push(current);
      }
    }
  });
  console.log('result:', result)
  return result;
};