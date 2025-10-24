// src/types/database.types.ts

import { School } from "./school.types";

// 通用时间戳字段，几乎所有表都有
export interface Timestamps {
  created_at: Date;
  updated_at: Date;
}

// 
/**
 * 通用状态枚举
 * ACTIVE  激活
 */
export enum Status {
  ACTIVE = 1,
  INACTIVE = 0
}



// 用户角色枚举 - 新增职员角色
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  MANUFACTURER_ADMIN = 'manufacturer_admin',
  STAFF = 'staff' // 厂商职员
}

// 学生支付状态枚举
export enum PaymentStatus {
  PAID = 1,
  UNPAID = 0,
}

// 厂商 (Manufacturers)
export interface Manufacturer extends Timestamps {
  id: number;
  name: string;
  contact_person: string;
  contact_phone: string;
  status: Status;
}

// 带学校信息的厂商类型
export interface ManufacturerWithSchools extends Manufacturer {
  schools: School[];
}



// 定义数据库返回的用户行结构（与表字段完全一致）
export interface UserRow extends Timestamps {
  id: number;
  username: string;
  password: string;
  realname: string;
  phone: string;
  email: string;
  role: UserRole;
  role_id: number;
  manufacturer_id: number | null;
  status: Status;
  last_login_at: string | null;
  // 确保包含所有User类型的字段
}




// 完整用户类型（包含密码，用于数据库操作）
export interface User extends Timestamps {
  id: number;
  username: string;
  password: string; // 存储的是加密后的哈希值
  realname: string;
  phone: string;
  email: string;
  role: UserRole;
  role_id: number;
  manufacturer_id: number | null; // 超级管理员此字段为 NULL
  status: Status;
  last_login_at: string | null;
  // 关联查询时可能需要的字段
  manufacturer?: Manufacturer | null;
}

// 不含密码的用户类型（用于前端返回）
export type UserWithoutPassword = Omit<User, 'password'>;