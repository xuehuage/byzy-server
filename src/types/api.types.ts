// src/types/api.types.ts
import { Status, UserRole, PaymentStatus, Manufacturer, User, } from './database.types';
import { Class, Grade } from './gradeClass.types';
import { School, Student } from './school.types';

// 常用于创建或更新时接收请求体的类型
// 这些类型通常省略了数据库中自动生成的字段（如 id, timestamps）

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>; // 响应中永远不要返回密码
  token: string;
}

// 统一响应格式
export interface ApiResponse<T = any> {
  code: number;       // 状态码：200成功，401未授权，404不存在等
  data: T;            // 成功时返回的数据
  message: string;    // 提示信息（成功/错误描述）
}

// Manufacturer Types
export type CreateManufacturerRequest = Omit<Manufacturer, 'id' | 'created_at' | 'updated_at'>;
export type UpdateManufacturerRequest = Partial<CreateManufacturerRequest>;

// School Types
export type CreateSchoolRequest = Omit<School, 'id' | 'created_at' | 'updated_at' | 'manufacturer'>;
export type UpdateSchoolRequest = Partial<CreateSchoolRequest>;

// Grade Types
export type CreateGradeRequest = Omit<Grade, 'id' | 'created_at' | 'updated_at' | 'school'>;
export type UpdateGradeRequest = Partial<CreateGradeRequest>;

// Class Types
export type CreateClassRequest = Omit<Class, 'id' | 'created_at' | 'updated_at' | 'grade'>;
export type UpdateClassRequest = Partial<CreateClassRequest>;

// Student Types
export type CreateStudentRequest = Omit<Student, 'id' | 'created_at' | 'updated_at' | 'class'>;
export type UpdateStudentRequest = Partial<CreateStudentRequest>;

// User Types (创建用户时，密码是明文，但存入数据库是哈希值)
export type CreateUserRequest = Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login_at' | 'manufacturer'> & {
  password: string; // 这里是明文密码
};
export type UpdateUserRequest = Partial<CreateUserRequest>;

// 常用于列表查询返回的类型，可能包含关联信息
export interface SchoolWithManufacturer extends School {
  manufacturer: Manufacturer;
}

export interface GradeWithSchool extends Grade {
  school: School;
}

export interface ClassWithGrade extends Class {
  grade: Grade;
}

export interface StudentWithClass extends Student {
  class: Class;
}

export interface UserWithManufacturer extends Omit<User, 'password'> {
  manufacturer: Manufacturer | null;
}




