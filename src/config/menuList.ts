import { MenuItem } from '../types/menu.types';
import { UserRole } from '../types/database.types'; // 导入数据库定义的角色枚举

// 系统菜单配置（基于数据库UserRole枚举控制权限）
export const menuList: MenuItem[] = [
    {
        id: 1,
        name: "仪表盘",
        path: "/dashboard",
        icon: "DashboardOutlined",
        roles: [
            UserRole.SUPER_ADMIN,
            UserRole.MANUFACTURER_ADMIN,
            UserRole.STAFF
        ] // 所有角色可见
    },
    {
        id: 2,
        name: "厂商管理",
        path: "/manufacturer",
        icon: "BuildingOutlined",
        roles: [UserRole.SUPER_ADMIN] // 仅超级管理员可见
    },
    {
        id: 3,
        name: "学校管理",
        path: "/school",
        icon: "SchoolOutlined",
        roles: [
            UserRole.SUPER_ADMIN,
            UserRole.MANUFACTURER_ADMIN
        ] // 超级管理员和厂商管理员可见
    },
    {
        id: 4,
        name: "用户管理",
        path: "/user",
        icon: "UserOutlined",
        roles: [
            UserRole.SUPER_ADMIN,
            UserRole.MANUFACTURER_ADMIN
        ] // 超级管理员和厂商管理员可见
    },
    {
        id: 5,
        name: "学生管理",
        path: "/student",
        icon: "UserAddOutlined",
        roles: [
            UserRole.SUPER_ADMIN,
            UserRole.MANUFACTURER_ADMIN,
            UserRole.STAFF
        ],
        children: [
            {
                id: 51,
                name: "学生列表",
                path: "/student/list",
                icon: "TableOutlined",
                roles: [
                    UserRole.SUPER_ADMIN,
                    UserRole.MANUFACTURER_ADMIN,
                    UserRole.STAFF
                ] // 所有角色可见
            },
            {
                id: 52,
                name: "学籍管理",
                path: "/student/status",
                icon: "EditOutlined",
                roles: [
                    UserRole.SUPER_ADMIN,
                    UserRole.MANUFACTURER_ADMIN
                ] // 仅管理员角色可见，职员无权限
            }
        ]
    },

];
