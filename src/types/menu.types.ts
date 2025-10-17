import { UserRole } from "./database.types";

/** 菜单项接口 */
export interface MenuItem {
    id: number;
    name: string;
    path: string;
    icon: string; // 图标组件名称（如"DashboardOutlined"）
    roles: UserRole[]; // 允许访问的角色列表
    parent_id: number;
    showInMenu: number;
    children?: MenuItem[]; // 子菜单（可选）
}

/** 获取菜单响应接口 */
export interface UserMenuResponse {
    code: number;
    data: MenuItem[];
    message: string;
}
